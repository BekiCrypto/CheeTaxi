# CheeTaxi Brand Guidelines v1.0

> These guidelines define how the CheeTaxi brand appears across every surface — apps, web, marketing, social, email, packaging. Follow them strictly.

---

## 1. Brand Essence

| Dimension      | Definition                                         |
| -------------- | -------------------------------------------------- |
| **Name**       | CheeTaxi (one word, capital C and T)               |
| **Pronounced** | "Chee-Tax-ee"                                      |
| **Meaning**    | Fast, reliable, African, modern, technology-first  |
| **Mission**    | The most modern mobility platform for Africa       |
| **Tone**       | Premium yet accessible. Confident, warm, clear.    |

## 2. Logo System

### 2.1 Primary logo — horizontal
Used on light backgrounds. File: `brand/logos/cheetaxi-horizontal.svg`.

### 2.2 Mark only
Used as favicon, app icon, avatar, profile picture. Files:
- `brand/logos/cheetaxi-mark.svg` (orange on transparent)
- `brand/logos/cheetaxi-mark-dark.svg` (orange on dark)

### 2.3 Clear space
The mark requires clear space equal to the height of the "C" cutout on every side. Never crowd the logo with text or imagery.

### 2.4 Minimum sizes
- Print: 24mm wide
- Digital: 96px wide
- App icon: 1024×1024px (App Store / Play Store)
- Favicon: 32×32px

### 2.5 Don'ts
- ❌ Do not stretch, skew, or rotate the logo
- ❌ Do not change the brand colors
- ❌ Do not place the logo on busy or low-contrast backgrounds
- ❌ Do not add drop shadows, bevels, or glow effects
- ❌ Do not recreate the logo with different fonts

## 3. Color System

### 3.1 Primary palette

| Token       | Hex       | RGB              | Usage                              |
| ----------- | --------- | ---------------- | ---------------------------------- |
| `brand.500` | `#F08C00` | 240, 140, 0      | Primary brand color — CTAs, links  |
| `brand.400` | `#FFA800` | 255, 168, 0      | Hover / gradient top               |
| `brand.600` | `#CC7000` | 204, 112, 0      | Active / pressed                   |
| `brand.50`  | `#FFF8E7` | 255, 248, 231    | Tinted backgrounds                 |

### 3.2 Neutral palette (`ink`)

| Token       | Hex       | Usage                              |
| ----------- | --------- | ---------------------------------- |
| `ink.900`   | `#0E1012` | Primary text on light              |
| `ink.700`   | `#2A2E34` | Headings on light                  |
| `ink.500`   | `#5A606B` | Body text secondary                |
| `ink.300`   | `#B0B5BC` | Disabled text                      |
| `ink.100`   | `#EEEFF1` | Borders, dividers                  |
| `ink.50`    | `#F7F7F8` | Page background tint               |

### 3.3 Status colors

| Token       | Hex       | Usage         |
| ----------- | --------- | ------------- |
| `success`   | `#10B981` | Success states |
| `danger`    | `#EF4444` | Errors, SOS    |
| `warning`   | `#F59E0B` | Warnings       |
| `info`      | `#3B82F6` | Information    |

### 3.4 Color contrast
All text/background combinations must meet WCAG 2.1 AA contrast ratio (4.5:1 for normal text, 3:1 for large text).

## 4. Typography

### 4.1 Font families
- **Display / Headings:** Plus Jakarta Sans (Google Fonts)
- **Body / UI:** Inter (Google Fonts)
- **Monospace (code, IDs):** SF Mono, JetBrains Mono, monospace fallback

### 4.2 Type scale

| Role            | Family            | Size  | Weight | Line height |
| --------------- | ----------------- | ----- | ------ | ----------- |
| Display H1      | Plus Jakarta Sans | 72px  | 800    | 1.05        |
| Display H2      | Plus Jakarta Sans | 56px  | 800    | 1.1         |
| Heading H3      | Plus Jakarta Sans | 40px  | 700    | 1.2         |
| Heading H4      | Plus Jakarta Sans | 28px  | 700    | 1.3         |
| Body Large      | Inter             | 18px  | 400    | 1.6         |
| Body            | Inter             | 16px  | 400    | 1.6         |
| Body Small      | Inter             | 14px  | 400    | 1.5         |
| Caption         | Inter             | 12px  | 500    | 1.4         |
| Button          | Inter             | 15px  | 600    | 1           |

### 4.3 Multi-language
For Amharic, Oromo, Tigrinya, Arabic — fall back to Noto Sans for the respective script. Latin languages use Inter / Plus Jakarta Sans.

## 5. Spacing & Layout

Base unit: 4px. Use multiples of 4 (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80).

Container widths:
- Mobile: 100% — 16px padding
- Tablet: 720px max
- Desktop: 1200px max
- Wide: 1440px max

## 6. Component Principles

### 6.1 Buttons
- **Primary:** orange background, white text, 24px radius, 14px vertical / 24px horizontal padding
- **Secondary:** ink-900 background
- **Ghost:** 1px border ink-200, ink-700 text
- **Disabled:** 50% opacity, no hover

### 6.2 Cards
- 12–16px radius
- 1px border `ink.100`
- 6px shadow `0 1px 2px rgba(0,0,0,0.04)`
- Hover: shadow `0 4px 12px rgba(0,0,0,0.08)`

### 6.3 Inputs
- 8–12px radius
- Filled background `ink.50`
- 1px border on focus `brand.400`
- 2px focus ring `brand.100`

### 6.4 Animation
- Default duration: 200ms
- Default easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Hover lift: `translateY(-2px)` over 150ms

## 7. Iconography

- Use Material Symbols (Rounded) for UI icons
- Stroke width: 1.5px on 24px grid
- Color follows current text color
- For feature illustrations, use custom-drawn icons with brand-orange accents

## 8. Illustration & Imagery

- Style: flat, geometric, warm
- Primary palette: brand orange + neutral inks + occasional emerald accents
- Show diverse Ethiopian/African people in real settings
- Avoid stock photos of generic cities — use Addis Ababa landmarks when possible
- Never use imagery that reinforces negative stereotypes

## 9. Tone of Voice

| Do                              | Don't                            |
| ------------------------------- | -------------------------------- |
| "Ride free. No platform fees."  | "Get free rides!!!"              |
| "Keep 100% of every fare."      | "Make more money than ever!!!"   |
| "We could not find a driver."   | "Oops! Something went wrong :("  |
| "Your code expires in 5 minutes." | "Hurry up! Code about to expire!" |

Principles:
1. **Clear** — short sentences, plain words
2. **Confident** — no hedging, no exclamation marks
3. **Warm** — use "we" and "you", acknowledge frustration
4. **Honest** — never promise what we can't deliver

## 10. Application Across Surfaces

| Surface              | Logo                | Primary font            | Notes                                |
| -------------------- | ------------------- | ----------------------- | ------------------------------------ |
| Web landing          | Horizontal          | Plus Jakarta Sans       | Max 1200px container                 |
| Web admin            | Mark only (sidebar) | System UI               | Dense, functional                    |
| Web dispatcher       | Mark only           | System UI               | Dark theme for ops                   |
| Mobile (passenger)   | Mark only           | Plus Jakarta Sans       | Material 3 with brand color overrides |
| Mobile (driver)      | Mark only           | Plus Jakarta Sans       | Material 3, dark theme primary       |
| Email                | Horizontal          | Inter                   | 600px max width                      |
| Push notification    | —                   | System                  | Max 50 chars title, 100 chars body   |
| Social media         | Mark / OG image     | Plus Jakarta Sans       | 1200×630 for OG                      |
| App Store / Play     | App icon 1024²      | —                       | Screenshots in portrait, 1242×2208   |

## 11. Email Templates

Templates live in `brand/email-templates/`. Each template must:
- Use a 600px container
- Inline all CSS (use a build tool like Premailer)
- Include the CheeTaxi logo (horizontal, 120px wide)
- Include unsubscribe link in the footer
- Include registered company address in the footer (CAN-SPAM compliance)
- Provide a plain-text alternative

Required templates:
1. Welcome
2. OTP verification
3. Trip receipt
4. Subscription purchased
5. Subscription expiring
6. Subscription expired
7. Driver approved / rejected
8. SOS acknowledgment
9. Password reset
10. Support ticket update

## 12. Asset Library

```
brand/
├── logos/
│   ├── cheetaxi-horizontal.svg     # Primary horizontal lockup
│   ├── cheetaxi-mark.svg           # Mark only (light)
│   └── cheetaxi-mark-dark.svg      # Mark only (dark)
├── app-store/
│   ├── app-icon.svg                # 1024×1024
│   └── splash.svg                  # iOS splash screen
├── social/
│   └── opengraph.svg               # 1200×630 social share
└── email-templates/
    └── (HTML email templates)
```

## 13. Trademark

"CheeTaxi" and the CheeTaxi logo are trademarks of CheeTaxi Technologies. Use of the brand without express written permission is prohibited. Partners and media outlets may request brand assets at `brand@cheetaxi.africa`.

---

For questions or brand review, contact `brand@cheetaxi.africa`.
