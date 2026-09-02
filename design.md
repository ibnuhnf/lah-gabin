# Design System — Lah Gabin

## Brand Identity

**Brand Name**: Lah Gabin
**Product**: Es Gabin Aneka Rasa
**Contact**: WhatsApp 0821-2149-8255
**Tagline**: "Es Gabin, Dingin di Hati, Pedas di Lidah" / "Lah Gabin — Es Gabin Kekinian"

---

## Color Palette

### Primary Colors

| Token | Hex | Usage |
|---|---|---|
| `blue-900` | `#0A2540` | Sidebar admin, headings, nav backgrounds |
| `blue-800` | `#1B4D89` | Primary buttons, active states, hero gradient top |
| `blue-700` | `#2E6DB5` | Hover states, secondary accents |
| `blue-600` | `#3B82F6` | Links, icons, highlights |
| `blue-500` | `#60A5FA` | Badge backgrounds, lighter accents |
| `blue-100` | `#DBEAFE` | Tag backgrounds, subtle highlights |
| `blue-50` | `#EFF6FF` | Page backgrounds, card borders |

### Neutrals

| Token | Hex | Usage |
|---|---|---|
| `white` | `#FFFFFF` | Card backgrounds, page backgrounds, text on dark |
| `gray-50` | `#F9FAFB` | Alternate row backgrounds, subtle fills |
| `gray-100` | `#F3F4F6` | Borders, dividers |
| `gray-300` | `#D1D5DB` | Disabled states, placeholder text |
| `gray-500` | `#6B7280` | Secondary text, labels |
| `gray-700` | `#374151` | Body text |
| `gray-900` | `#111827` | Primary text, headings |

### Accent Colors

| Token | Hex | Usage |
|---|---|---|
| `orange-500` | `#F97316` | Primary CTA buttons (Pesan, Checkout) |
| `orange-600` | `#EA580C` | CTA hover state |
| `yellow-400` | `#FACC15` | Badges, highlights, stars |
| `red-500` | `#EF4444` | Danger states, cancel, errors |
| `green-500` | `#22C55E` | Success states, approved orders |
| `amber-500` | `#F59E0B` | Warning states, pending orders |

### Status Badges

| Badge | Background | Text | Usage |
|---|---|---|---|
| Ready Stock | `#DCFCE7` | `#166534` | Stock available |
| Pre-Order (PO) | `#FEF3C7` | `#92400E` | Pre-order mode |
| Nonaktif | `#F3F4F6` | `#6B7280` | Inactive product |
| Pending | `#FEF3C7` | `#92400E` | Order pending approval |
| Diterima/Proses | `#DBEAFE` | `#1E40AF` | Order accepted |
| Selesai | `#DCFCE7` | `#166534` | Order completed |
| Dibatalkan | `#FEE2E2` | `#991B1B` | Order cancelled |

---

## Typography

**Font Family** (via Google Fonts or CDN):
- Headings: `Poppins` (weights: 600, 700)
- Body: `Inter` (weights: 400, 500, 600)

**Fallbacks**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

### Scale

| Token | Size | Line Height | Usage |
|---|---|---|---|
| `text-xs` | 12px | 16px | Labels, captions, timestamps |
| `text-sm` | 14px | 20px | Secondary text, table cells |
| `text-base` | 16px | 24px | Body text |
| `text-lg` | 18px | 28px | Card titles, subtitles |
| `text-xl` | 20px | 28px | Section headings |
| `text-2xl` | 24px | 32px | Page titles |
| `text-3xl` | 30px | 36px | Hero headings |
| `text-4xl` | 36px | 40px | Brand name large |

**Letter Spacing**: Headings `-0.02em`, body `0`.

---

## Spacing System

Base unit: `4px`. Scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`.

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Icon gaps |
| `space-2` | 8px | Tight padding |
| `space-3` | 12px | Card internal padding (compact) |
| `space-4` | 16px | Card padding, form gaps |
| `space-5` | 20px | Section gaps |
| `space-6` | 24px | Page padding (mobile) |
| `space-8` | 32px | Section spacing |
| `space-10` | 40px | Large section spacing |
| `space-12` | 48px | Page margins (desktop) |

**Border Radius**:
- Buttons/inputs: `rounded-lg` (8px)
- Cards: `rounded-xl` (12px)
- Badges/pills: `rounded-full` (9999px)
- Modals: `rounded-2xl` (16px)

---

## Shadows

| Token | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)` | Cards, dropdowns |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)` | Modals, popovers |
| `shadow-card` | `0 2px 8px rgba(0,0,0,0.06)` | Product cards |
| `shadow-button` | `0 4px 12px rgba(249,115,22,0.3)` | Primary CTA buttons (orange) |

---

## Layout System

### Breakpoints

| Breakpoint | Width | Usage |
|---|---|---|
| `sm` | 640px | Large phones landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |

### Customer Web (Mobile-First)

- **Container max-width**: `640px` (mobile app feel), `1024px` (tablet/desktop grid)
- **Page padding**: `16px` horizontal (mobile), `24px` (tablet), `32px` (desktop)
- **Grid**: 1 column (mobile), 2 columns (tablet `md`), 3 columns (desktop `lg`)

### Admin Web (Desktop-First)

- **Sidebar width**: `240px` collapsed `64px`
- **Header height**: `64px`
- **Content max-width**: `1280px`
- **Page padding**: `24px` all sides

---

## Component Library

### 1. Navigation & Header

**Customer Nav**:
- Sticky top, `backdrop-filter: blur(12px)`, `background: rgba(255,255,255,0.9)` on scroll
- Logo left, store status badge center, WhatsApp icon right
- Bottom navigation bar (mobile): 4 items — Home, Menu, Keranjang, Lacak Order
- Active item: icon fill + text color `blue-600`

**Admin Sidebar**:
- Fixed left, `background: #0A2540`, `text: white`
- Logo at top, nav items with icons, logout at bottom
- Active item: `background: rgba(255,255,255,0.1)`, left border `3px solid #3B82F6`
- Collapsed mode: icons only, tooltip on hover

### 2. Buttons

**Primary CTA (Pesan, Checkout)**:
- Background: `orange-500`
- Text: `white`, `font-weight: 600`
- Padding: `12px 24px`
- Border radius: `8px`
- Shadow: `shadow-button`
- Hover: `orange-600`, scale `1.02`

**Secondary Button**:
- Background: `white`
- Border: `1px solid blue-600`
- Text: `blue-600`
- Hover: `blue-50` background

**Danger Button**:
- Background: `red-500`
- Text: `white`
- Hover: `red-600`

**Icon Button**:
- `48x48px`, `border-radius: 50%`, `gray-100` background
- Hover: `gray-200`

**Disabled Button**:
- `gray-300` background, `gray-500` text, no shadow, cursor `not-allowed`

### 3. Cards

**Product Card (Customer)**:
- `background: white`, `border-radius: 12px`
- Shadow: `shadow-card`
- Padding: `0` (image full bleed top), `16px` (content)
- Image: `aspect-ratio: 4/3`, `object-fit: cover`, `border-radius: 12px 12px 0 0`
- Title: `text-base font-semibold gray-900`
- Price: `text-lg font-bold blue-800` (or `gray-400 line-through` if discounted)
- Discount badge: absolute top-right, `orange-500` background, white text
- Status badge: below title, pill style
- Button "Pesan": full width, `orange-500`, `font-weight: 600`

**KPI Card (Admin)**:
- `background: white`, `border-radius: 12px`
- Padding: `24px`
- Icon: 40x40 circle, `blue-100` background, `blue-600` icon
- Value: `text-2xl font-bold gray-900`
- Label: `text-sm gray-500`
- Trend indicator: `green-500` up arrow or `red-500` down arrow

**Order Card (Admin)**:
- `background: white`, `border-radius: 12px`, left border `4px solid` (color by status)
- Padding: `16px`
- Row layout: left (order info), right (action buttons)
- Status badge: top-right corner

### 4. Forms

**Text Input**:
- Height: `44px` (touch-friendly)
- Border: `1px solid gray-300`
- Border radius: `8px`
- Padding: `12px 16px`
- Focus: `2px solid blue-500`, no outline
- Error: `1px solid red-500`, error message below in `red-500`

**Textarea**:
- Same styling, `min-height: 100px`

**Select**:
- Same height, custom arrow icon, dropdown `white` background, `shadow-lg`

**Quantity Stepper**:
- Container: flex, `gray-100` background, `border-radius: 8px`
- Minus/Plus buttons: `40x40px`, `white` background, icon
- Number display: `min-width: 40px`, center, `font-weight: 600`

**Checkbox & Radio**:
- Custom styled, `blue-500` when checked

### 5. Badges & Tags

- Pill shape (`border-radius: 9999px`)
- Padding: `4px 12px`
- Font size: `text-xs`, `font-weight: 600`

### 6. Tables (Admin)

- Header: `gray-50` background, `text-sm font-semibold gray-700`, sticky
- Rows: alternating `white` / `gray-50`
- Row hover: `blue-50`
- Cell padding: `12px 16px`
- Border: `1px solid gray-100`

### 7. Modals & Overlays

- Backdrop: `rgba(0,0,0,0.5)`, `backdrop-filter: blur(4px)`
- Modal: `white`, `border-radius: 16px`, `shadow-lg`, max-width `480px`
- Padding: `24px`
- Close button: top-right, `gray-400`, hover `gray-600`

### 8. Toast & Notifications

- Position: top-center (customer), top-right (admin)
- Border-radius: `8px`
- Success: `green-500` left border
- Error: `red-500` left border
- Warning: `amber-500` left border
- Auto-dismiss: `3000ms`

### 9. Skeleton Loaders

- `background: linear-gradient(90deg, gray-100 25%, gray-50 50%, gray-100 75%)`
- Animation: `shimmer 1.5s infinite`

---

## Page-Specific Styles

### Customer — Beranda (Hero)

```
background: linear-gradient(135deg, #1B4D89 0%, #0A2540 100%)
min-height: 100vh
text: white
logo: "LAH GABIN" — text-4xl, font-weight: 700, letter-spacing: -0.02em
tagline: text-lg, opacity: 0.9
CTA: orange-500 button, white text
store-badge: "BUKA" (green) / "TUTUP" (red)
```

### Customer — Katalog/Menu

```
background: white
page-title: text-2xl font-bold gray-900
grid: responsive, gap: 16px
filter-bar: horizontal scroll (mobile), chips for categories
```

### Customer — Checkout

```
background: gray-50
order-summary-card: white, shadow-md
form-card: white, shadow-md
total-section: divider top, bold text
```

### Customer — Invoice PDF (jsPDF)

```
Page: A4, margin 20mm
Header: logo centered, brand name, invoice code
Info row: date, customer name, phone
Table: headers blue-100, rows white, borders light
Totals: right-aligned, bold for grand total
Footer: payment instructions, note about pending status
Colors map to brand palette
```

### Admin — Dashboard

```
background: gray-50
sidebar: #0A2540
kpi-grid: 4 columns (lg), 2 columns (md), 1 column (sm), gap: 24px
chart-section: white card, 2 columns
table-section: white card, full width
```

### Admin — Sidebar Navigation

```
Background: #0A2540 (blue-900)
Nav items: white text, icon left, padding 12px 16px
Active: rgba(255,255,255,0.1) bg, left border 3px blue-500
Hover: rgba(255,255,255,0.05) bg
Sections: "Umum", "Transaksi", "Master Data", "Laporan" (grouped with dividers)
```

---

## Animations & Transitions

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Button hover | `transform: scale(1.02)` | 150ms | `ease-out` |
| Card hover | `transform: translateY(-2px)` + shadow increase | 200ms | `ease-out` |
| Modal open | `opacity: 0→1` + `scale: 0.95→1` | 200ms | `ease-out` |
| Toast enter | `translateY(-20px)→0` + `opacity` | 300ms | `ease-out` |
| Page transition | Fade | 200ms | `ease-in-out` |
| Skeleton shimmer | Gradient slide | 1500ms | `linear` (infinite) |
| Store badge pulse | Scale pulse when "BUKA" | 2000ms | `ease-in-out` (infinite) |

---

## Responsive Behavior

| Component | Mobile (<768px) | Desktop (≥768px) |
|---|---|---|
| Nav | Bottom bar 4 items | Top bar + sidebar for admin |
| Product grid | 1 column | 2-3 columns |
| Checkout layout | Single column | 2 columns (summary left, form right) |
| Admin tables | Horizontal scroll | Full width |
| Sidebar | Hidden, hamburger menu | Fixed visible |
| Modal | Full screen | Centered, max 480px |

---

## Accessibility

- Color contrast: minimum `4.5:1` for normal text, `3:1` for large text
- Focus states: visible `2px blue-500` outline on all interactive elements
- Touch targets: minimum `44x44px` for mobile
- Screen reader: semantic HTML, ARIA labels on icons
- Reduced motion: respect `prefers-reduced-motion`

---

## Icon Library

**Library**: Lucide React (consistent stroke-based icons, tree-shakeable)

Key icons:
- `Store` / `Storefront` — Store status
- `ShoppingCart` / `Cart` — Keranjang
- `Package` / `Box` — Products
- `Receipt` — Orders/Invoice
- `Users` — Customers
- `BarChart3` — Dashboard/Analytics
- `Settings` — Settings
- `LogOut` — Logout
- `Search` — Search
- `Filter` — Filter
- `Plus` / `Minus` — Quantity stepper
- `Check` / `CheckCircle` — Approve/Success
- `X` / `XCircle` — Cancel/Error
- `AlertCircle` — Warning
- `WhatsApp` — WhatsApp integration
- `FileText` — Invoice/PDF
- `Download` — Download
- `Eye` — View detail
- `Edit` — Edit
- `Trash2` — Delete
- `ChevronDown` — Dropdown
- `ChevronLeft` / `ChevronRight` — Pagination/Navigation
- `Clock` — Time/History
- `DollarSign` — Money/Revenue
- `TrendingUp` / `TrendingDown` — Growth indicators
- `Bell` — Notifications

---

## Implementation Notes

### Tailwind Config Integration

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1B4D89',
          900: '#0A2540',
        },
        orange: {
          500: '#F97316',
          600: '#EA580C',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.06)',
        'button': '0 4px 12px rgba(249,115,22,0.3)',
      },
      borderRadius: {
        'card': '12px',
        'modal': '16px',
      }
    }
  }
}
```

### CSS Variables (if not using Tailwind)

```css
:root {
  --blue-900: #0A2540;
  --blue-800: #1B4D89;
  --blue-700: #2E6DB5;
  --blue-600: #3B82F6;
  --blue-500: #60A5FA;
  --blue-100: #DBEAFE;
  --blue-50: #EFF6FF;
  --orange-500: #F97316;
  --orange-600: #EA580C;
  --white: #FFFFFF;
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-300: #D1D5DB;
  --gray-500: #6B7280;
  --gray-700: #374151;
  --gray-900: #111827;
  --shadow-card: 0 2px 8px rgba(0,0,0,0.06);
  --shadow-button: 0 4px 12px rgba(249,115,22,0.3);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
  --radius-card: 12px;
  --radius-modal: 16px;
  --radius-btn: 8px;
  --sidebar-width: 240px;
  --sidebar-collapsed: 64px;
  --header-height: 64px;
}
```

### Favicon & App Icons

- Primary color: `#1B4D89` (blue-800)
- Logo: text-based "LG" or ice cream cube icon
- PWA manifest: include `theme_color: #1B4D89`, `background_color: #FFFFFF`

---

## Image Strategy

### Product Photos
- Aspect ratio: `4:3` ( enforced via crop in admin upload)
- Max file size: `2MB`
- Auto-resize: `800x600` (display), `400x300` (thumbnail)
- Format: WebP with JPEG fallback
- Lazy loading with blur placeholder

### Hero/Banner
- Full-width, `16:9` or `21:9`
- Max height: `480px` desktop, `280px` mobile
- Overlay gradient: `linear-gradient(180deg, transparent 0%, rgba(10,37,64,0.8) 100%)`

### Admin Dashboard Charts
- Library: Recharts (React-friendly, tree-shakeable)
- Theme: match brand palette (blue primary, orange accent)
- Grid lines: `gray-100`
- Tooltips: white background, `shadow-md`

---

*Document version: 1.0*
*Last updated: aligned with arsitektur-sistem.md*
