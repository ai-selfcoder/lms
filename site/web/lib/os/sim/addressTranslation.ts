/**
 * Deterministic address-translation simulator (client-side, pure).
 *
 * Translates a single virtual address to a physical one, returning a full
 * step-by-step decomposition so the UI can visualise how the bits split and how
 * translation proceeds. Never touches DOM or network.
 *
 * Modes:
 *  - "base-bound":  dynamic relocation (pa = base + va, checked against bound);
 *  - "paging":      va = VPN | offset, pa = table[VPN]·pageSize + offset, with
 *                   an optional TLB layer (cached VPNs translate without a table
 *                   read);
 *  - "multi-level": va = L1 | L2 | offset, walked through a two-level table
 *                   where an absent outer entry means the sub-table was never
 *                   allocated (the whole point of multi-level tables).
 */

export type AddrMode = "base-bound" | "paging" | "multi-level";

export interface AddrParams {
  mode: AddrMode;
  /** Size of the virtual address space in bits (e.g. 8 → 256 B). */
  vaBits: number;
  /** Offset bits → page size = 2^pageBits. Paging / multi-level. */
  pageBits?: number;
  /** The virtual address to translate. */
  va: number;
  // base-bound:
  base?: number;
  bound?: number;
  // paging: page table, VPN → PFN, negative entry = invalid (not mapped).
  table?: number[];
  /** Paging: VPNs currently cached in the TLB. Presence enables the TLB layer. */
  tlb?: number[];
  // multi-level:
  /** Bits for [level1, level2] indices (offset takes the remaining low bits). */
  levelBits?: number[];
  /** Outer directory: each entry is an inner table (VPN2 → PFN, -1 invalid) or null (sub-table not allocated). */
  multi?: (number[] | null)[];
}

export interface AddrTrace {
  mode: AddrMode;
  ok: boolean;
  va: number;
  pa: number | null;
  vaBits: number;
  pageBits?: number;
  // paging decomposition:
  vpn?: number;
  offset?: number;
  pfn?: number;
  /** Whether the TLB satisfied the translation (paging mode with a TLB). */
  tlbHit?: boolean;
  // multi-level decomposition:
  l1?: number;
  l2?: number;
  levelBits?: number[];
  /** One-line human reason for success / fault. */
  reason: string;
  /** Ordered explanation steps (Russian). */
  steps: string[];
}

const clampInt = (n: number) => (Number.isFinite(n) ? Math.trunc(n) : 0);

export function translate(params: AddrParams): AddrTrace {
  if (params.mode === "base-bound") return baseBound(params);
  if (params.mode === "multi-level") return multiLevel(params);
  return paging(params);
}

function baseBound(p: AddrParams): AddrTrace {
  const va = clampInt(p.va);
  const base = clampInt(p.base ?? 0);
  const bound = clampInt(p.bound ?? 0);
  const steps: string[] = [
    `Виртуальный адрес: va = ${va}`,
    `Граница процесса: bound = ${bound} (валидны адреса 0 … ${Math.max(0, bound - 1)})`,
  ];

  if (va < 0 || va >= bound) {
    steps.push(
      va < 0
        ? `va < 0 — недопустимый адрес → защита срабатывает (segfault)`
        : `va ≥ bound (${va} ≥ ${bound}) — выход за пределы → защита срабатывает (segfault)`
    );
    return {
      mode: "base-bound", ok: false, va, pa: null, vaBits: p.vaBits,
      reason: "Обращение вне границ процесса — segmentation fault", steps,
    };
  }

  const pa = base + va;
  steps.push(`Проверка пройдена: 0 ≤ ${va} < ${bound}`);
  steps.push(`Физический адрес: pa = base + va = ${base} + ${va} = ${pa}`);
  return {
    mode: "base-bound", ok: true, va, pa, vaBits: p.vaBits,
    reason: "Успех: адрес перемещён прибавлением base", steps,
  };
}

function paging(p: AddrParams): AddrTrace {
  const pageBits = Math.max(1, clampInt(p.pageBits ?? 4));
  const pageSize = 1 << pageBits;
  const va = clampInt(p.va);
  const table = p.table ?? [];
  const vpn = Math.floor(va / pageSize);
  const offset = va % pageSize;
  const hasTlb = Array.isArray(p.tlb);

  const steps: string[] = [
    `Размер страницы = 2^${pageBits} = ${pageSize} Б, младшие ${pageBits} бит — смещение (offset)`,
    `va = ${va} → VPN = ${vpn}, offset = ${offset}`,
  ];

  const valid = vpn >= 0 && vpn < table.length && table[vpn] >= 0;
  let tlbHit: boolean | undefined;

  if (hasTlb) {
    tlbHit = (p.tlb as number[]).includes(vpn) && valid;
    if (tlbHit) {
      const pfn = table[vpn];
      const pa = pfn * pageSize + offset;
      steps.push(`TLB: VPN ${vpn} найден — TLB hit, таблицу страниц читать не нужно`);
      steps.push(`pa = PFN ${pfn} · ${pageSize} + ${offset} = ${pa}`);
      return {
        mode: "paging", ok: true, va, pa, vaBits: p.vaBits, pageBits, vpn, offset, pfn, tlbHit: true,
        reason: "TLB hit: перевод взят из кэша трансляций", steps,
      };
    }
    steps.push(`TLB: VPN ${vpn} не найден — TLB miss, идём в таблицу страниц`);
  }

  if (vpn < 0 || vpn >= table.length) {
    steps.push(`VPN ${vpn} вне таблицы страниц (записей: ${table.length}) → page fault`);
    return { mode: "paging", ok: false, va, pa: null, vaBits: p.vaBits, pageBits, vpn, offset, tlbHit, reason: "VPN за пределами таблицы — page fault", steps };
  }
  const pfn = table[vpn];
  if (pfn < 0) {
    steps.push(`table[${vpn}] невалидна (страница не отображена) → page fault`);
    return { mode: "paging", ok: false, va, pa: null, vaBits: p.vaBits, pageBits, vpn, offset, tlbHit, reason: "Запись таблицы невалидна — page fault", steps };
  }

  const pa = pfn * pageSize + offset;
  steps.push(`table[${vpn}] = кадр ${pfn} (валидно)`);
  if (hasTlb) steps.push(`перевод кладём в TLB — следующее обращение к этой странице будет быстрым`);
  steps.push(`pa = PFN ${pfn} · ${pageSize} + ${offset} = ${pa}`);
  return {
    mode: "paging", ok: true, va, pa, vaBits: p.vaBits, pageBits, vpn, offset, pfn, tlbHit,
    reason: hasTlb ? "TLB miss → таблица: страница найдена" : "Успех: VPN переведён в PFN", steps,
  };
}

function multiLevel(p: AddrParams): AddrTrace {
  const pageBits = Math.max(1, clampInt(p.pageBits ?? 4));
  const pageSize = 1 << pageBits;
  const lb = p.levelBits ?? [2, 2];
  const l1Bits = Math.max(1, lb[0]);
  const l2Bits = Math.max(1, lb[1]);
  const va = clampInt(p.va);
  const multi = p.multi ?? [];

  const l1 = (va >> (l2Bits + pageBits)) & ((1 << l1Bits) - 1);
  const l2 = (va >> pageBits) & ((1 << l2Bits) - 1);
  const offset = va & (pageSize - 1);

  const steps: string[] = [
    `Адрес делится на три части: L1 (${l1Bits} бит) | L2 (${l2Bits} бит) | offset (${pageBits} бит)`,
    `va = ${va} → L1 = ${l1}, L2 = ${l2}, offset = ${offset}`,
  ];

  const inner = l1 >= 0 && l1 < multi.length ? multi[l1] : undefined;
  if (inner == null) {
    steps.push(`Внешний каталог[${l1}] пуст — подтаблица не выделена (экономия памяти) → page fault`);
    return { mode: "multi-level", ok: false, va, pa: null, vaBits: p.vaBits, pageBits, l1, l2, offset, levelBits: [l1Bits, l2Bits], reason: "Подтаблица L2 не выделена — page fault", steps };
  }
  steps.push(`Внешний каталог[${l1}] → подтаблица существует, читаем её (1-е обращение в память)`);

  const pfn = l2 >= 0 && l2 < inner.length ? inner[l2] : -1;
  if (pfn < 0) {
    steps.push(`Подтаблица[${l2}] невалидна → page fault`);
    return { mode: "multi-level", ok: false, va, pa: null, vaBits: p.vaBits, pageBits, l1, l2, offset, levelBits: [l1Bits, l2Bits], reason: "Запись L2 невалидна — page fault", steps };
  }

  const pa = pfn * pageSize + offset;
  steps.push(`Подтаблица[${l2}] = кадр ${pfn} (2-е обращение в память)`);
  steps.push(`pa = PFN ${pfn} · ${pageSize} + ${offset} = ${pa}`);
  return {
    mode: "multi-level", ok: true, va, pa, vaBits: p.vaBits, pageBits, l1, l2, offset, pfn, levelBits: [l1Bits, l2Bits],
    reason: "Успех: пройдены два уровня таблицы (за это платим лишним обращением в память)", steps,
  };
}

/** Render a number as a fixed-width binary string (helper for the UI). */
export function toBits(n: number, bits: number): string {
  if (n < 0) return "".padStart(bits, "0");
  return (n >>> 0).toString(2).padStart(bits, "0").slice(-bits);
}
