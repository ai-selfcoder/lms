# Playground (yaegi → WASM) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Дать читателю учебника запускаемый блок Go-кода, который исполняется
полностью в браузере (нулевая нагрузка на сервер) через yaegi-интерпретатор,
скомпилированный в WASM.

**Architecture:** Go-обёртка над yaegi (`runner` пакет) собирается в `play.wasm`
и крутится в одном Web Worker на страницу. Книжная страница рендерится как сейчас
(markdown → HTML-строка); rehype-плагин превращает ```` ```go play ```` фенсы в
острова-плейсхолдеры, которые клиентский `<RunnableMounter>` гидрирует в React-
компонент `<Runnable>` (Monaco + кнопки + вывод). Watchdog в главном потоке убивает
бесконечные циклы через `worker.terminate()`.

**Tech Stack:** Go 1.25 + `github.com/traefik/yaegi` (сборка через Docker
`golang:1.25`, `GOOS=js GOARCH=wasm`); Next.js 15 / React 19; Monaco
(`@monaco-editor/react`, уже в проекте); DS-компоненты `@/ds`; Vitest для TS-тестов.

**Спек:** `docs/superpowers/specs/2026-06-29-playground-wasm-design.md`

---

## Файловая структура

| Файл | Ответственность |
|---|---|
| `site/playwasm/go.mod` | модуль обёртки playground |
| `site/playwasm/runner/runner.go` | `Run(code string) Result` через yaegi — без js-зависимостей, тестируется нативно |
| `site/playwasm/runner/runner_test.go` | нативные тесты семантики/покрытия stdlib |
| `site/playwasm/symbols/symbols.go` | курированное подмножество stdlib для yaegi |
| `site/playwasm/main.go` | `//go:build js && wasm` — регистрирует `runGo` в JS, зовёт `runner.Run` |
| `site/playwasm/build.ps1` | локальная сборка через Go 1.24.4: нативные тесты → wasm → копия wasm_exec.js → замер размера |
| `site/web/public/play/play.wasm` | артефакт (генерируется) |
| `site/web/public/play/wasm_exec.js` | Go-glue (копируется из образа) |
| `site/web/lib/playground/worker.ts` | загрузка wasm, протокол run, перехват вывода |
| `site/web/lib/playground/client.ts` | один воркер/страница, очередь, watchdog, респаун |
| `site/web/lib/playground/client.test.ts` | Vitest: очередь и таймаут на mock-воркере |
| `site/web/components/play/Runnable.tsx` | редактор + кнопки + вывод |
| `site/web/components/play/RunnableMounter.tsx` | сканирует `[data-runnable]`, гидрирует острова |
| `site/web/lib/remark-runnable.ts` | remark-плагин: `go play` фенс → плейсхолдер-остров |
| `site/web/lib/remark-runnable.test.ts` | Vitest: трансформация фенса |
| `site/web/lib/markdown.ts` | подключить `remarkRunnable` в pipeline (модификация) |
| `site/web/components/book/BookChapterView.tsx` | смонтировать `<RunnableMounter>` (модификация) |

---

## Task 1: Спайк + ядро runner (GATE)

Это решающий шаг: если yaegi не покрывает базовые сниппеты или `play.wasm` слишком
тяжёлый — стоп, возвращаемся к выбору движка. **Никакого UI до прохождения гейта.**

**Files:**
- Create: `site/playwasm/go.mod`
- Create: `site/playwasm/runner/runner.go`
- Create: `site/playwasm/runner/runner_test.go`
- Create: `site/playwasm/main.go`
- Create: `site/playwasm/build.ps1`
- Modify: `site/web/package.json` (скрипт `build:playwasm`)

**Среда сборки:** локальный Go 1.24.4 (`C:\Users\Yura\sdk\go1.24.4\bin\go.exe`),
Docker не используется. `wasm_exec.js` берётся из
`$(go env GOROOT)\lib\wasm\wasm_exec.js`. Сеть для скачивания модуля yaegi есть.

- [ ] **Step 1: Модуль**

`site/playwasm/go.mod`:
```
module goconcurrency/playwasm

go 1.24

require github.com/traefik/yaegi v0.16.1
```
(Сборку запускать с `GOTOOLCHAIN=local`, чтобы Go 1.24.4 не тянул другой тулчейн.)

- [ ] **Step 2: Написать падающий тест**

`site/playwasm/runner/runner_test.go`:
```go
package runner

import "testing"

func TestRun(t *testing.T) {
	cases := []struct {
		name   string
		code   string
		expect string // подстрока, ожидаемая в stdout
	}{
		{
			name: "hello",
			code: `package main
import "fmt"
func main() { fmt.Println("привет, Go") }`,
			expect: "привет, Go",
		},
		{
			name: "strings_strconv",
			code: `package main
import ("fmt"; "strings"; "strconv")
func main() {
	fmt.Println(strings.ToUpper("go"), strconv.Itoa(2*21))
}`,
			expect: "GO 42",
		},
		{
			name: "slices_loop",
			code: `package main
import "fmt"
func main() {
	sum := 0
	for _, v := range []int{1,2,3,4} { sum += v }
	fmt.Println("sum=", sum)
}`,
			expect: "sum= 10",
		},
		{
			name: "goroutine_channel",
			code: `package main
import ("fmt"; "sync")
func main() {
	ch := make(chan int)
	var wg sync.WaitGroup
	wg.Add(1)
	go func(){ defer wg.Done(); ch <- 7 }()
	fmt.Println("got", <-ch)
	wg.Wait()
}`,
			expect: "got 7",
		},
		{
			name: "compile_error",
			code: `package main
func main() { undefinedThing() }`,
			expect: "", // stdout пуст
		},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			r := Run(c.code)
			if c.name == "compile_error" {
				if r.Err == "" {
					t.Fatalf("ожидалась ошибка, получили пусто; stdout=%q", r.Stdout)
				}
				return
			}
			if r.Err != "" {
				t.Fatalf("неожиданная ошибка: %s", r.Err)
			}
			if !contains(r.Stdout, c.expect) {
				t.Fatalf("stdout=%q не содержит %q", r.Stdout, c.expect)
			}
		})
	}
}

func contains(s, sub string) bool {
	return len(sub) == 0 || (len(s) >= len(sub) && indexOf(s, sub) >= 0)
}
func indexOf(s, sub string) int {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub { return i }
	}
	return -1
}
```

- [ ] **Step 3: Реализовать runner (минимум, полный stdlib для спайка)**

`site/playwasm/runner/runner.go`:
```go
// Package runner исполняет произвольный Go-сниппет в интерпретаторе yaegi и
// возвращает захваченный вывод. Без js-зависимостей — тестируется нативно.
package runner

import (
	"bytes"
	"time"

	"github.com/traefik/yaegi/interp"
	"github.com/traefik/yaegi/stdlib"
)

// Result — итог одного запуска.
type Result struct {
	Stdout     string
	Stderr     string
	Err        string
	DurationMs int64
}

// Run интерпретирует code и возвращает захваченные stdout/stderr и ошибку.
// yaegi автоматически вызывает main() при Eval пакета main.
func Run(code string) Result {
	var out, errb bytes.Buffer
	i := interp.New(interp.Options{Stdout: &out, Stderr: &errb})
	// ВНИМАНИЕ (проверить в спайке): на спайке используем полный stdlib.Symbols,
	// чтобы гарантированно пройти тесты и честно измерить размер. Курирование —
	// Task 2.
	if err := i.Use(stdlib.Symbols); err != nil {
		return Result{Err: err.Error()}
	}
	start := time.Now()
	_, err := i.Eval(code)
	dur := time.Since(start).Milliseconds()
	res := Result{Stdout: out.String(), Stderr: errb.String(), DurationMs: dur}
	if err != nil {
		res.Err = err.Error()
	}
	return res
}
```

- [ ] **Step 4: build.ps1 (локальная сборка, без Docker)**

`site/playwasm/build.ps1`:
```powershell
# Локальная сборка playwasm через Go 1.24.4: нативные тесты -> wasm -> копия
# wasm_exec.js -> замер размера. Запускать из любого места (пути относительны
# к расположению скрипта). Docker не используется.
$ErrorActionPreference = "Stop"
$env:GOTOOLCHAIN = "local"

# Найти go: сначала PATH, затем ~/sdk/go*/bin/go.exe.
$go = (Get-Command go -ErrorAction SilentlyContinue).Source
if (-not $go) {
  $go = (Get-ChildItem "$env:USERPROFILE\sdk\go*\bin\go.exe" -ErrorAction SilentlyContinue |
         Sort-Object FullName -Descending | Select-Object -First 1).FullName
}
if (-not $go) { throw "Go toolchain не найден (ни в PATH, ни в ~/sdk)" }
"go: $go"

$here = $PSScriptRoot
Push-Location $here
try {
  & $go mod tidy
  if ($LASTEXITCODE -ne 0) { throw "go mod tidy failed" }

  # Нативные тесты (windows/amd64). Падают -> падает сборка.
  & $go test ./runner/...
  if ($LASTEXITCODE -ne 0) { throw "native tests failed" }

  $out = Join-Path $here "..\web\public\play"
  New-Item -ItemType Directory -Force -Path $out | Out-Null

  $env:GOOS = "js"; $env:GOARCH = "wasm"
  & $go build -trimpath -ldflags "-s -w" -o (Join-Path $out "play.wasm") .
  $build = $LASTEXITCODE
  Remove-Item Env:GOOS, Env:GOARCH -ErrorAction SilentlyContinue
  if ($build -ne 0) { throw "wasm build failed" }

  $root = & $go env GOROOT
  Copy-Item (Join-Path $root "lib\wasm\wasm_exec.js") (Join-Path $out "wasm_exec.js") -Force

  # Замер размера (raw + gzip).
  $wasm = Join-Path $out "play.wasm"
  $raw = (Get-Item $wasm).Length
  $ms = New-Object System.IO.MemoryStream
  $fs = [System.IO.File]::OpenRead($wasm)
  $gz = New-Object System.IO.Compression.GzipStream($ms, [System.IO.Compression.CompressionLevel]::Optimal)
  $fs.CopyTo($gz); $gz.Dispose(); $fs.Dispose()
  "play.wasm raw : {0:N0} bytes ({1:N2} MB)" -f $raw, ($raw/1MB)
  "play.wasm gzip: {0:N0} bytes ({1:N2} MB)" -f $ms.Length, ($ms.Length/1MB)
} finally {
  Pop-Location
}
```

- [ ] **Step 5: main.go (js/wasm обёртка)**

`site/playwasm/main.go`:
```go
//go:build js && wasm

// Команда playwasm регистрирует глобальную JS-функцию runGo(code) -> {stdout,
// stderr, err, durationMs} и сигналит готовность через __goReady().
package main

import (
	"syscall/js"

	"goconcurrency/playwasm/runner"
)

func runGo(_ js.Value, args []js.Value) any {
	if len(args) < 1 {
		return map[string]any{"err": "нет кода", "stdout": "", "stderr": "", "durationMs": 0}
	}
	r := runner.Run(args[0].String())
	return map[string]any{
		"stdout":     r.Stdout,
		"stderr":     r.Stderr,
		"err":        r.Err,
		"durationMs": r.DurationMs,
	}
}

func main() {
	js.Global().Set("runGo", js.FuncOf(runGo))
	if ready := js.Global().Get("__goReady"); ready.Type() == js.TypeFunction {
		ready.Invoke()
	}
	select {} // не давать рантайму завершиться, иначе runGo исчезнет
}
```

- [ ] **Step 6: Прогнать нативные тесты (TDD-цикл)**

Run (PowerShell, из корня репо):
```
$env:GOTOOLCHAIN="local"; & "$env:USERPROFILE\sdk\go1.24.4\bin\go.exe" -C site/playwasm mod tidy
$env:GOTOOLCHAIN="local"; & "$env:USERPROFILE\sdk\go1.24.4\bin\go.exe" -C site/playwasm test ./runner/...
```
Expected: первый прогон — FAIL (если есть огрехи в runner) → чинить runner.go до
зелёного. Финал: `ok goconcurrency/playwasm/runner`.

Особое внимание (подтвердить в этом шаге):
- yaegi реально автозапускает `main()` при `Eval` пакета `main` (тест `hello`).
- `compile_error` даёт непустой `Err`.
- Сниппет с горутиной+WaitGroup отдаёт `got 7`.

- [ ] **Step 7: npm-скрипт**

`site/web/package.json` — добавить в `scripts` (build.ps1 уже создан в Step 4):
```json
"build:playwasm": "powershell -NoProfile -ExecutionPolicy Bypass -File ../playwasm/build.ps1"
```

- [ ] **Step 8: Собрать артефакт и ЗАМЕРИТЬ размер (GATE)**

Run: `cd site/web && npm run build:playwasm`
Expected: создаются `site/web/public/play/play.wasm` и `wasm_exec.js`; печатается
raw- и gzip-размер.

**Критерий гейта:** gzip-размер `play.wasm` ≤ ~8 МБ И нативные тесты зелёные.
- Прошли → дальше Task 2.
- Не прошли по размеру → Task 2 (курирование) обязателен и, вероятно, достаточен;
  если и после Task 2 > ~8 МБ — СТОП, эскалировать (вернуться к выбору движка в
  спеке).

- [ ] **Step 9: Commit**

```bash
git add site/playwasm site/web/package.json site/web/public/play/.gitkeep
git commit -m "feat(play): спайк yaegi→wasm — runner, нативные тесты, docker-сборка"
```
(Артефакт `play.wasm` коммитим отдельно в Task 2 после курирования.)

---

## Task 2: Курированное подмножество stdlib (через `yaegi extract`)

Уменьшаем размер wasm. **Важно:** импорт пакета `github.com/traefik/yaegi/stdlib`
тянет в линковку ВЕСЬ stdlib (его `init()` ссылается на reflect.Value всех 155
пакетов), поэтому фильтрация `stdlib.Symbols` размер НЕ уменьшает. Правильный путь —
не импортировать `stdlib` вовсе, а сгенерировать привязки только нужных пакетов
утилитой `yaegi extract`. Тогда линкуются только реально нужные пакеты.

Подтверждено в Task 1: формат ключей yaegi `"<importpath>/<pkgname>"`, yaegi v0.16.1,
155 пакетов в полном наборе.

**Курируемые пакеты (реальные import-пути):** `fmt errors strings strconv sort
slices maps math math/rand time sync sync/atomic context bufio bytes unicode
unicode/utf8`. (`os` намеренно НЕ берём в MVP: у него платформенные различия
windows↔js, а extract на host-GOOS может включить windows-only символы, которые не
скомпилируются под js/wasm. Для джун-примеров достаточно `fmt`.)

**Files:**
- Create: `site/playwasm/symbols/symbols.go` (объявление `Symbols` + `go:generate`)
- Create: `site/playwasm/symbols/*.go` (генерируются `yaegi extract`, по файлу на пакет)
- Modify: `site/playwasm/runner/runner.go` (использовать `symbols.Symbols` вместо `stdlib`)

- [ ] **Step 1: Объявить пакет symbols с директивой генерации**

`site/playwasm/symbols/symbols.go`:
```go
// Package symbols — курированный набор stdlib-привязок для yaegi. Файлы
// <pkg>.go генерируются `yaegi extract` (см. go:generate ниже) и наполняют
// Symbols в своих init(). НЕ импортируем yaegi/stdlib — иначе в wasm попадёт
// весь stdlib и размер не упадёт.
package symbols

import "reflect"

//go:generate go run github.com/traefik/yaegi/cmd/yaegi extract fmt errors strings strconv sort slices maps math math/rand time sync sync/atomic context bufio bytes unicode unicode/utf8

// Symbols наполняется сгенерированными файлами; передаётся в i.Use(...).
var Symbols = map[string]map[string]reflect.Value{}
```

- [ ] **Step 2: Сгенерировать привязки**

`yaegi extract` берёт имя пакета-получателя из `$GOPACKAGE` (его выставляет
`go generate`). Запускать через `go generate` именно из каталога `symbols`, чтобы
сгенерированные файлы получили `package symbols`:

Run (PowerShell, из корня репо):
```
$env:GOTOOLCHAIN="local"
$go = "$env:USERPROFILE\sdk\go1.24.4\bin\go.exe"
& $go -C site/playwasm get github.com/traefik/yaegi/cmd/yaegi@v0.16.1
Push-Location site/playwasm/symbols
& $go generate .
Pop-Location
```
Expected: появляются файлы `fmt.go`, `errors.go`, `strings.go`, … по одному на
пакет, каждый с `package symbols`, `func init()` и записью вида
`Symbols["fmt/fmt"] = map[string]reflect.Value{ ... }`.

Если `yaegi extract` не находится — поставить CLI явно:
```
& $go install github.com/traefik/yaegi/cmd/yaegi@v0.16.1
```
и заменить вызов в `go:generate`/команде на бинарь из `$(go env GOPATH)\bin\yaegi.exe`.

- [ ] **Step 3: Переключить runner на курированный набор**

В `site/playwasm/runner/runner.go`:
```go
import (
	"bytes"
	"time"

	"github.com/traefik/yaegi/interp"
	"goconcurrency/playwasm/symbols"
)
```
```go
	if err := i.Use(symbols.Symbols); err != nil {
		return Result{Err: err.Error()}
	}
```
Удалить импорт `github.com/traefik/yaegi/stdlib`. После этого во всём модуле
playwasm не должно остаться ни одной ссылки на `yaegi/stdlib` (проверить grep'ом).

- [ ] **Step 4: Прогнать нативные тесты — все 5 кейсов зелёные**

Run (PowerShell):
```
$env:GOTOOLCHAIN="local"; & "$env:USERPROFILE\sdk\go1.24.4\bin\go.exe" -C site/playwasm test ./runner/...
```
Expected: `ok goconcurrency/playwasm/runner`. Если кейс упал на отсутствующем
пакете — добавить пакет в список `yaegi extract` (Step 1) и перегенерировать.

- [ ] **Step 5: Пересобрать и ЗАМЕРИТЬ размер (это и есть смысл задачи)**

Run: `cd site/web && npm run build:playwasm`
Expected: gzip-размер заметно меньше Task 1 (8.05 МБ). Цель — комфортно ниже ~8 МБ;
ориентир для курированного набора ~3–6 МБ gzip. Если падения почти нет — значит
`stdlib` всё ещё где-то импортируется (вернуться к Step 3, проверить grep).

- [ ] **Step 6: Commit (вместе с артефактом)**

```bash
git add site/playwasm/symbols site/playwasm/runner/runner.go site/playwasm/go.mod \
        site/playwasm/go.sum site/web/public/play/play.wasm site/web/public/play/wasm_exec.js
git commit -m "feat(play): курированный stdlib через yaegi extract + собранный play.wasm"
```
(Сгенерированные файлы `symbols/*.go` коммитим — они часть исходников и не требуют
повторной генерации при обычной сборке.)

---

## Task 3: Web Worker (загрузка wasm + протокол)

**Files:**
- Create: `site/web/lib/playground/worker.ts`

- [ ] **Step 1: Реализовать воркер**

`site/web/lib/playground/worker.ts`:
```ts
/// <reference lib="webworker" />
// Воркер playground: лениво грузит play.wasm (yaegi) и исполняет код.
// Протокол:
//   main -> worker: { type: "run", id, code }
//   worker -> main: { type: "loading" } | { type: "ready" }
//                 | { type: "result", id, stdout, stderr, err, durationMs }
declare const self: DedicatedWorkerGlobalScope & {
  runGo?: (code: string) => RunGoResult;
  __goReady?: () => void;
  Go?: new () => GoInstance;
};

interface RunGoResult {
  stdout: string;
  stderr: string;
  err: string;
  durationMs: number;
}
interface GoInstance {
  importObject: WebAssembly.Imports;
  run(instance: WebAssembly.Instance): Promise<void>;
}

let readyPromise: Promise<void> | null = null;

function ensureReady(): Promise<void> {
  if (readyPromise) return readyPromise;
  self.postMessage({ type: "loading" });
  readyPromise = (async () => {
    // wasm_exec.js определяет self.Go
    self.importScripts("/play/wasm_exec.js");
    const go = new self.Go!();
    const res = await fetch("/play/play.wasm");
    const { instance } = await WebAssembly.instantiateStreaming(res, go.importObject);
    const ready = new Promise<void>((resolve) => {
      self.__goReady = () => resolve();
    });
    void go.run(instance); // блокирует на select{} — НЕ await
    await ready;           // ждём, пока Go зарегистрирует runGo
    self.postMessage({ type: "ready" });
  })();
  return readyPromise;
}

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data as { type: string; id?: number; code?: string };
  if (msg.type !== "run" || typeof msg.id !== "number") return;
  try {
    await ensureReady();
    const r = self.runGo!(msg.code ?? "");
    self.postMessage({
      type: "result",
      id: msg.id,
      stdout: r.stdout,
      stderr: r.stderr,
      err: r.err,
      durationMs: r.durationMs,
    });
  } catch (err) {
    self.postMessage({
      type: "result",
      id: msg.id,
      stdout: "",
      stderr: "",
      err: err instanceof Error ? err.message : String(err),
      durationMs: 0,
    });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add site/web/lib/playground/worker.ts
git commit -m "feat(play): web worker — ленивая загрузка play.wasm и протокол run"
```

---

## Task 4: Клиент-синглтон + watchdog

Один воркер на страницу, очередь запросов, таймаут с `terminate()` и респауном.

**Files:**
- Create: `site/web/lib/playground/client.ts`
- Create: `site/web/lib/playground/client.test.ts`

- [ ] **Step 1: Написать падающий тест (Vitest, mock-воркер)**

`site/web/lib/playground/client.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { runCode, __setWorkerFactory, RunOutput } from "./client";

// Управляемый фейковый воркер.
class FakeWorker {
  onmessage: ((e: { data: unknown }) => void) | null = null;
  posted: unknown[] = [];
  terminated = false;
  postMessage(m: unknown) {
    this.posted.push(m);
    const msg = m as { type: string; id: number; code: string };
    if (msg.type === "run" && msg.code !== "LOOP") {
      // мгновенный ответ
      queueMicrotask(() =>
        this.onmessage?.({
          data: { type: "result", id: msg.id, stdout: "OK", stderr: "", err: "", durationMs: 1 },
        })
      );
    }
    // code === "LOOP" -> никогда не отвечает (имитация for{})
  }
  terminate() { this.terminated = true; }
}

let last: FakeWorker;
beforeEach(() => {
  __setWorkerFactory(() => {
    last = new FakeWorker();
    return last as unknown as Worker;
  });
});

describe("runCode", () => {
  it("возвращает stdout успешного запуска", async () => {
    const out: RunOutput = await runCode("print");
    expect(out.stdout).toBe("OK");
    expect(out.timedOut).toBe(false);
  });

  it("по таймауту терминейтит воркер и помечает timedOut", async () => {
    vi.useFakeTimers();
    const p = runCode("LOOP", { timeoutMs: 1000 });
    await vi.advanceTimersByTimeAsync(1001);
    const out = await p;
    expect(out.timedOut).toBe(true);
    expect(last.terminated).toBe(true);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Запустить — убедиться, что падает**

Run: `cd site/web && npx vitest run lib/playground/client.test.ts`
Expected: FAIL — `runCode`/`__setWorkerFactory` не существуют.

- [ ] **Step 3: Реализовать клиент**

`site/web/lib/playground/client.ts`:
```ts
// Один воркер playground на страницу. Сериализует запуски, навешивает watchdog:
// если воркер не ответил за timeoutMs — terminate() и пересоздание.
export interface RunOutput {
  stdout: string;
  stderr: string;
  err: string;
  durationMs: number;
  timedOut: boolean;
}

type WorkerFactory = () => Worker;

let factory: WorkerFactory = () =>
  new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });

// Для тестов.
export function __setWorkerFactory(f: WorkerFactory) {
  factory = f;
  worker = null;
}

let worker: Worker | null = null;
let seq = 0;
let chain: Promise<unknown> = Promise.resolve();

function getWorker(): Worker {
  if (!worker) worker = factory();
  return worker;
}

const DEFAULT_TIMEOUT = 5000;

function once(code: string, timeoutMs: number): Promise<RunOutput> {
  const w = getWorker();
  const id = ++seq;
  return new Promise<RunOutput>((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      w.onmessage = null;
      w.terminate();
      worker = null; // следующий запуск пересоздаст воркер
      resolve({ stdout: "", stderr: "", err: "", durationMs: timeoutMs, timedOut: true });
    }, timeoutMs);

    w.onmessage = (e: MessageEvent) => {
      const msg = e.data as { type: string; id?: number } & Partial<RunOutput>;
      if (msg.type === "loading" || msg.type === "ready") return;
      if (msg.type !== "result" || msg.id !== id) return;
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve({
        stdout: msg.stdout ?? "",
        stderr: msg.stderr ?? "",
        err: msg.err ?? "",
        durationMs: msg.durationMs ?? 0,
        timedOut: false,
      });
    };
    w.postMessage({ type: "run", id, code });
  });
}

// Публичный API: запуски сериализуются, чтобы один воркер не пересекал ответы.
export function runCode(code: string, opts?: { timeoutMs?: number }): Promise<RunOutput> {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT;
  const run = () => once(code, timeoutMs);
  const result = chain.then(run, run);
  chain = result.catch(() => undefined);
  return result;
}
```

- [ ] **Step 4: Запустить тесты — зелёные**

Run: `cd site/web && npx vitest run lib/playground/client.test.ts`
Expected: PASS (2 теста).

- [ ] **Step 5: Commit**

```bash
git add site/web/lib/playground/client.ts site/web/lib/playground/client.test.ts
git commit -m "feat(play): клиент-синглтон воркера с очередью и watchdog-таймаутом"
```

---

## Task 5: Компонент `<Runnable>`

**Files:**
- Create: `site/web/components/play/Runnable.tsx`

- [ ] **Step 1: Реализовать компонент**

`site/web/components/play/Runnable.tsx`:
```tsx
"use client";

import { useState, useRef, useCallback, lazy, Suspense } from "react";
import { Button, Terminal, type TerminalStatus } from "@/ds";
import { runCode, type RunOutput } from "@/lib/playground/client";

// Monaco грузится лениво — только когда читатель решил редактировать/запускать.
const MonacoEditor = lazy(() => import("@monaco-editor/react"));

const PlayIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);
const ResetIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
  </svg>
);

function statusOf(running: boolean, out: RunOutput | null): TerminalStatus {
  if (running) return "running";
  if (!out) return "idle";
  if (out.timedOut) return "timeout";
  if (out.err) return "fail";
  return "pass";
}

function renderOutput(out: RunOutput): string {
  if (out.timedOut) return "⏱ превышен лимит времени (5с)";
  const parts: string[] = [];
  if (out.stdout) parts.push(out.stdout.replace(/\n$/, ""));
  if (out.stderr) parts.push(out.stderr.replace(/\n$/, ""));
  if (out.err) parts.push(out.err);
  return parts.join("\n");
}

export function Runnable({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [running, setRunning] = useState(false);
  const [out, setOut] = useState<RunOutput | null>(null);
  const [loadingRuntime, setLoadingRuntime] = useState(false);
  const firstRun = useRef(true);

  const onRun = useCallback(async () => {
    setRunning(true);
    if (firstRun.current) setLoadingRuntime(true);
    try {
      const r = await runCode(code);
      setOut(r);
    } finally {
      firstRun.current = false;
      setLoadingRuntime(false);
      setRunning(false);
    }
  }, [code]);

  const onReset = useCallback(() => {
    setCode(initialCode);
    setOut(null);
  }, [initialCode]);

  const status = statusOf(running, out);
  const lines = Math.min(20, Math.max(4, code.split("\n").length));

  return (
    <div
      style={{
        border: "1px solid var(--border-default)",
        borderRadius: 10,
        overflow: "hidden",
        margin: "16px 0",
        background: "var(--bg-surface)",
      }}
    >
      <div style={{ display: "flex", gap: 8, padding: "8px 10px", borderBottom: "1px solid var(--border-subtle)" }}>
        <Button hierarchy="accent" size="sm" onClick={onRun} disabled={running} loading={running} iconLeft={running ? undefined : PlayIcon}>
          {running ? "Выполняется" : "Запустить"}
        </Button>
        <Button hierarchy="secondary" size="sm" onClick={onReset} disabled={running} iconLeft={ResetIcon}>
          Сбросить
        </Button>
      </div>

      <Suspense fallback={<pre style={{ margin: 0, padding: 12, fontFamily: "var(--font-mono)", fontSize: 13 }}>{code}</pre>}>
        <MonacoEditor
          height={`${lines * 20 + 24}px`}
          defaultLanguage="go"
          theme="vs-dark"
          value={code}
          onChange={(v) => setCode(v ?? "")}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            tabSize: 4,
            insertSpaces: false,
            lineNumbers: "off",
            folding: false,
            padding: { top: 10, bottom: 10 },
            automaticLayout: true,
          }}
        />
      </Suspense>

      {(out || running) && (
        <Terminal
          status={status}
          output={loadingRuntime ? "Загрузка среды Go… (один раз)" : out ? renderOutput(out) : ""}
          height={140}
          style={{ borderRadius: 0, border: "none", borderTop: "1px solid var(--border-default)" }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add site/web/components/play/Runnable.tsx
git commit -m "feat(play): компонент <Runnable> — ленивый Monaco, вывод через Terminal"
```

---

## Task 6: remark-плагин `go play`

**Почему remark, а не rehype:** фенс-мета (`play`) доступна надёжно только на
уровне mdast (`node.lang`, `node.meta`). `remark-rehype` не переносит `meta` в
hast, а `rehype-pretty-code` к моменту rehype уже превращает `<pre><code>` в
подсвеченные спаны. Поэтому детектируем на remark и формируем выходной элемент
через `mdast-util-to-hast`-хинты `hName/hProperties/hChildren` — без сырого HTML и
без вмешательства pretty-code. Внутренний `<pre><code>` — статический no-JS
fallback; подсветку даёт Monaco после гидрации, так что pretty-code этим блокам не
нужен.

**Files:**
- Create: `site/web/lib/remark-runnable.ts`
- Create: `site/web/lib/remark-runnable.test.ts`

- [ ] **Step 1: Написать падающий тест**

`site/web/lib/remark-runnable.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkRunnable } from "./remark-runnable";

async function render(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRunnable)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(md);
  return String(file);
}

describe("remarkRunnable", () => {
  it("помечает ```go play блок островом с data-runnable и base64-кодом", async () => {
    const html = await render("```go play\npackage main\n```\n");
    expect(html).toContain("data-runnable");
    expect(html).toMatch(/data-code="[A-Za-z0-9+/=]+"/);
  });

  it("обычный ```go блок НЕ трогает", async () => {
    const html = await render("```go\npackage main\n```\n");
    expect(html).not.toContain("data-runnable");
  });
});
```

- [ ] **Step 2: Запустить — падает**

Run: `cd site/web && npx vitest run lib/remark-runnable.test.ts`
Expected: FAIL — `remarkRunnable` не существует.

- [ ] **Step 3: Реализовать плагин**

`site/web/lib/remark-runnable.ts`:
```ts
// remark-плагин: фенс ```go play превращается в остров, который клиент гидрирует
// в <Runnable>. Выходной элемент задаём хинтами mdast-util-to-hast
// (hName/hProperties/hChildren) — без сырого HTML и без allowDangerousHtml.
// Внутренний <pre><code> — статический no-JS fallback. Код кладём в data-code
// (base64), чтобы клиент поднял <Runnable> без повторного парсинга.
import type { Plugin } from "unified";
import type { Root, Code } from "mdast";
import { visit } from "unist-util-visit";

function b64(s: string): string {
  if (typeof Buffer !== "undefined") return Buffer.from(s, "utf8").toString("base64");
  // eslint-disable-next-line no-undef
  return btoa(unescape(encodeURIComponent(s)));
}

export const remarkRunnable: Plugin<[], Root> = () => (tree) => {
  visit(tree, "code", (node: Code) => {
    if (node.lang !== "go") return;
    if (!/\bplay\b/.test(node.meta ?? "")) return;
    const source = node.value;
    node.data = {
      ...node.data,
      hName: "div",
      hProperties: { dataRunnable: "", dataCode: b64(source) },
      hChildren: [
        {
          type: "element",
          tagName: "pre",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "code",
              properties: {},
              children: [{ type: "text", value: source }],
            },
          ],
        },
      ],
    };
  });
};
```

- [ ] **Step 4: Запустить тесты — зелёные**

Run: `cd site/web && npx vitest run lib/remark-runnable.test.ts`
Expected: PASS (2 теста). `unist-util-visit` уже в дереве зависимостей unified;
если TypeScript не видит типы `mdast` — они идут с `remark-parse` (`@types/mdast`).

- [ ] **Step 5: Commit**

```bash
git add site/web/lib/remark-runnable.ts site/web/lib/remark-runnable.test.ts
git commit -m "feat(play): remark-плагин — go play фенс в остров data-runnable"
```

---

## Task 7: Гидрация островов + интеграция + живой пример

**Files:**
- Create: `site/web/components/play/RunnableMounter.tsx`
- Modify: `site/web/lib/markdown.ts`
- Modify: `site/web/components/book/BookChapterView.tsx`
- Modify: один файл главы в `site/content/book/*.mdx` (живой пример)

- [ ] **Step 1: Маунтер островов**

`site/web/components/play/RunnableMounter.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Runnable } from "./Runnable";

function decode(b64: string): string {
  if (typeof window !== "undefined") return decodeURIComponent(escape(window.atob(b64)));
  return Buffer.from(b64, "base64").toString("utf8");
}

// Находит плейсхолдеры [data-runnable] из markdown и заменяет их интерактивным
// <Runnable>. Cleanup СИНХРОННЫЙ и снимает флаг data-mounted — иначе в dev
// strict mode (двойной прогон эффекта) повторный mount пропустит «уже
// смонтированные» острова, а отложенный unmount оставит их пустыми.
export function RunnableMounter() {
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-runnable]:not([data-mounted])")
    );
    const created: { el: HTMLElement; root: Root }[] = [];
    for (const el of nodes) {
      const code = decode(el.getAttribute("data-code") ?? "");
      el.setAttribute("data-mounted", "1");
      el.replaceChildren(); // убрать статический fallback (без innerHTML)
      const root = createRoot(el);
      root.render(<Runnable initialCode={code} />);
      created.push({ el, root });
    }
    return () => {
      for (const { el, root } of created) {
        root.unmount();
        el.removeAttribute("data-mounted");
      }
    };
  }, []);
  return null;
}
```

- [ ] **Step 2: Подключить плагин в markdown pipeline**

В `site/web/lib/markdown.ts` добавить импорт и шаг в **remark-фазе** — до
`remarkRehype`, чтобы мета фенса была доступна и наш остров не попал под
`rehype-pretty-code`:
```ts
import { remarkRunnable } from "./remark-runnable";
```
В цепочке `processor` (после `remarkGfm`, до `remarkRehype`):
```ts
  .use(remarkGfm)
  .use(remarkRunnable)
  .use(remarkRehype) // allowDangerousHtml off
```

- [ ] **Step 3: Смонтировать маунтер в книжной странице**

В `site/web/components/book/BookChapterView.tsx` импортировать и отрендерить
`<RunnableMounter />` один раз внутри корневого контейнера представления:
```tsx
import { RunnableMounter } from "@/components/play/RunnableMounter";
```
Добавить `<RunnableMounter />` рядом с областью, куда выводится `children`
(MDX-контент). Точное место — корневой `return` компонента, после контентного
блока.

- [ ] **Step 4: Живой пример в главе**

В существующий файл (напр. `site/content/book/channels.mdx`) добавить рядом с
вводным разделом блок:
````
```go play
package main

import "fmt"

func main() {
	ch := make(chan string, 1)
	ch <- "сигнал через канал"
	fmt.Println(<-ch)
}
```
````

- [ ] **Step 5: Проверка в preview**

Запустить dev-сервер и открыть страницу главы (`/go/book/channels`).
Проверить вручную через preview-инструменты:
- блок отрендерился как интерактивный, виден статический код сразу;
- «Запустить» → «Загрузка среды Go… (один раз)» → вывод `сигнал через канал`;
- в Network один запрос за `play.wasm`;
- заменить код на `for {}` и «Запустить» → через 5с «⏱ превышен лимит времени
  (5с)», вкладка не виснет, повторный запуск нормального кода снова работает;
- добавить второй `go play` блок на ту же страницу → по-прежнему один запрос за
  `play.wasm` (общий воркер).

- [ ] **Step 6: Прогнать TS-тесты и линт**

Run: `cd site/web && npx vitest run && npm run lint`
Expected: все тесты зелёные, линт без ошибок.

- [ ] **Step 7: Commit**

```bash
git add site/web/components/play/RunnableMounter.tsx site/web/lib/markdown.ts \
        site/web/components/book/BookChapterView.tsx site/content/book/channels.mdx
git commit -m "feat(play): гидрация островов + интеграция в книгу + живой пример"
```

---

## Self-Review (выполнено при написании)

**Покрытие спека:**
- Архитектура (остров + один воркер + watchdog) → Tasks 3–7. ✓
- Движок yaegi→wasm, только браузер → Tasks 1–2 (сервер не задействован). ✓
- Курированный stdlib → Task 2. ✓
- Состояния загрузки/ошибки/таймаута → Task 5 (`renderOutput`, `statusOf`). ✓
- Фенс `go play` → остров → Task 6. ✓
- Деградация (нет JS/Worker) → статический `<pre>` fallback сохраняется в Task 6
  (островом не заменяется без гидрации). ✓
- Спайк-гейт по размеру → Task 1 Step 8. ✓
- Живой пример + preview-проверка (вкл. `for {}` и один воркер) → Task 7. ✓

**Согласованность типов:** `RunOutput` (client.ts) единообразно используется в
client.test.ts и Runnable.tsx; `Result`/`RunGoResult` поля
(`stdout/stderr/err/durationMs`) совпадают между runner.go, main.go и worker.ts. ✓

**Плейсхолдеры:** конкретный код в каждом шаге; «проверить в спайке» относится
только к 2–3 фактам API yaegi (автозапуск main, формат ключей символов), которые
страхуются нативными тестами Task 1/2 — это не дыры, а явные точки верификации. ✓
