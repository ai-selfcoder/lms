# Base (Uber) Design System — токены для рескина

Источник: https://base.uber.com — Base Design System / Base Web. Светлая тема,
монохром + синий акцент, гротеск Uber Move (используем открытый аналог Geist),
строгая типографическая иерархия, аккуратная сетка. Редактор кода (Monaco) и его
терминал остаются ТЁМНЫМИ — как в любом IDE.

## Цвет (Base primitives, Light theme)

Mono-шкала (нейтральные):
```
mono100  #FFFFFF   mono200  #F6F6F6   mono300  #EEEEEE   mono400  #E2E2E2
mono500  #CBCBCB   mono600  #AFAFAF   mono700  #757575   mono800  #545454
mono900  #333333   mono1000 #000000
```
Семантика (фон/контент/границы в Light):
```
backgroundPrimary    #FFFFFF
backgroundSecondary  #F6F6F6   (mono200)
backgroundTertiary   #EEEEEE   (mono300)
contentPrimary       #000000
contentSecondary     #545454   (mono800)
contentTertiary      #757575   (mono700)
borderOpaque         #E2E2E2   (mono400)
borderSelected       #000000
```
Акценты и статусы:
```
accent   #276EF1   accent400 #276EF1   accent300 #5B91F5   accent700 #1E54B7   accent50 #EFF3FE
positive #05944F   positive400 #05944F  positive50 #E6F2EC
negative #E11900   negative400 #E11900  negative50 #FDEDE8
warning  #FFC043   warning400 #FFC043    warning50 #FFFAF0
```
Использование в продукте:
- Основной фон страниц — `backgroundPrimary` (#FFF); секции/карточки — `backgroundSecondary`.
- Primary-кнопка: фон `#000`, текст `#FFF`. Hover — `mono900`.
- Кнопка-акцент (Запустить): фон `accent #276EF1`, текст `#FFF`, hover `accent700`.
- Вердикты терминала: PASS → `positive`, FAIL → `negative`, RUN → `warning`.
- Ссылки: `accent`.
- Бейдж сложности: easy → positive50/positive, medium → accent50/accent700, hard → negative50/negative.

## Типографика (Base type scale)

Шрифт: **Geist Sans** (через `geist`/next-font) как аналог Uber Move; код — **Geist Mono**.
Масштаб (px / line-height / weight):
```
DisplayLarge   52 / 60 / 700        HeadingXXLarge 36 / 44 / 700
HeadingXLarge  32 / 40 / 700        HeadingLarge   28 / 36 / 600
HeadingMedium  24 / 32 / 600        HeadingSmall   20 / 28 / 600
HeadingXSmall  16 / 24 / 600
LabelLarge     18 / 28 / 500        LabelMedium    16 / 24 / 500
LabelSmall     14 / 20 / 500        LabelXSmall    12 / 16 / 500
ParagraphLarge 18 / 28 / 400        ParagraphMedium 16 / 24 / 400
ParagraphSmall 14 / 20 / 400        ParagraphXSmall 12 / 16 / 400
```
Заголовки — плотный трекинг (-0.01em…-0.02em на крупных). Body — `contentSecondary`
для длинного текста, `contentPrimary` для акцентов.

## Сетка / отступы (Base sizing scale)

```
100=4  200=6  300=8  400=10  500=12  550=14  600=16  700=20
800=24  900=32  1000=40  1200=48  1400=56  1600=64
```
Контент-контейнер: max-width ~1200px, боковые поля scale800 (24px).

## Границы и радиусы (Base borders)

```
radius: none=0  100=4  200=8  300=12  400=16  full=9999
borderWidth: 1px (hairline) и 2px (selected)
```
Базовый радиус компонентов — `radius200` (8px); крупные карточки — `radius300` (12px).
Границы — `1px solid borderOpaque (#E2E2E2)`; выбранное — `borderSelected (#000)`.

## Тени (Base lighting, сдержанные)

```
shadow-sm:  0 1px 2px rgba(0,0,0,.06)
shadow:     0 2px 8px rgba(0,0,0,.08)
shadow-lg:  0 8px 24px rgba(0,0,0,.10)
```
Base скуповат на тени — приоритет границам и плоскости, тени только для всплывающих
поверхностей (поповеры, активная карточка).

## Тёмные островки (код)

Monaco-редактор и панель терминала остаются тёмными (`backgroundInversePrimary`
≈ `#141414`, текст `#F6F6F6`), визуально «врезаны» в светлый layout рамкой и
радиусом. Это намеренный приём Base (inverse surface), а не отход от системы.

## Принципы Base, которым следуем

1. **Контраст и ясность** прежде декора: чёрный текст на белом, явная иерархия.
2. **Плоскость и сетка**: разделяем границами и отступами, а не тенями/градиентами.
3. **Один акцент** (синий) — только для интерактивного/важного, не для украшения.
4. **Доступность**: контраст AA+, фокус-кольца `accent`, кликабельные зоны ≥ 40px.
