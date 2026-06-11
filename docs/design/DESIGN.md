---
name: Sealshot
colors:
  surface: '#f4fbf8'
  surface-dim: '#d4dcd9'
  surface-bright: '#f4fbf8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef5f2'
  surface-container: '#e8efec'
  surface-container-high: '#e2eae7'
  surface-container-highest: '#dde4e1'
  on-surface: '#161d1b'
  on-surface-variant: '#3c4a46'
  inverse-surface: '#2b3230'
  inverse-on-surface: '#ebf2ef'
  outline: '#6b7a76'
  outline-variant: '#bacac5'
  surface-tint: '#006b5f'
  primary: '#006b5f'
  on-primary: '#ffffff'
  primary-container: '#2dd4bf'
  on-primary-container: '#00574d'
  inverse-primary: '#3cddc7'
  secondary: '#006a63'
  on-secondary: '#ffffff'
  secondary-container: '#99efe5'
  on-secondary-container: '#006f67'
  tertiary: '#8d4f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffac5a'
  on-tertiary-container: '#744000'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#62fae3'
  primary-fixed-dim: '#3cddc7'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005047'
  secondary-fixed: '#9cf2e8'
  secondary-fixed-dim: '#80d5cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#00504a'
  tertiary-fixed: '#ffdcc0'
  tertiary-fixed-dim: '#ffb875'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#6b3b00'
  background: '#f4fbf8'
  on-background: '#161d1b'
  surface-variant: '#dde4e1'
  surface-primary: '#ffffff'
  surface-secondary: '#f1f5fa'
  border-subtle: '#dbe3ee'
  text-primary: '#0b1220'
  text-secondary: '#5b6880'
  text-muted: '#7e8aa0'
  accent-highlight: '#c9f6ef'
  success-surface: '#e6faf5'
typography:
  headline-xl:
    fontFamily: inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  kicker:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  max-width: 1152px
  gutter: 24px
  margin-desktop: 48px
  margin-mobile: 20px
  section-padding: 80px
---

# Sealshot Design System

## Brand Identity
Sealshot is a privacy-first macOS screenshot application. The brand personality is airy, trustworthy, modern, and "Mac-like." It emphasizes local processing, transparency, and high-fidelity utility without the clutter of cloud services or accounts.

## Color Palette
- **Surface Primary**: `#ffffff` (Main backgrounds, cards)
- **Surface Secondary**: `#f1f5fa` (Soft ice-blue section bands, footers)
- **Border**: `#dbe3ee` (Fine lines for cards and inputs)
- **Text Primary**: `#0b1220` (Deep navy for headlines and main copy)
- **Text Secondary**: `#5b6880` (Slate for sublines and secondary info)
- **Text Muted**: `#7e8aa0` (Small captions and fine print)
- **Accent Primary**: `#2dd4bf` (Bright teal for primary CTAs and active states)
- **Accent Secondary**: `#0f766e` (Deep teal for links, kickers, and small labels)
- **Accent Highlight**: `#c9f6ef` (Pale mint for navigation backgrounds)
- **Success Surface**: `#e6faf5` (Notice banners)

## Typography
- **Font Family**: `system-ui, -apple-system, sans-serif` (macOS native feel)
- **H1**: Bold, deep navy, tight tracking.
- **H2/H3**: Semi-bold, navy.
- **Body**: Regular, slate, comfortable line-height (1.6).
- **Kicker**: 12px, bold, uppercase, deep teal, letter-spaced.

## Components & Patterns
- **Radius**: `12px` everywhere (buttons, cards, inputs).
- **Cards**: White background, 1px `#dbe3ee` border, subtle drop shadow.
- **Buttons**:
  - **Primary**: Bright teal background, deep navy text, 12px radius.
  - **Secondary**: Light gray or white with border, navy text.
- **Header**: Slim white bar, app icon + wordmark, nav links, teal pill button.
- **Footer**: Three columns on ice-blue background, muted legal line.
- **Inputs**: White background, light gray borders, 12px radius.

## Layout
- **Max Content Width**: `1152px`.
- **Spacing**: Generous whitespace, airy composition.
- **Grid**: 3-column features grid, single-column prose for privacy/support.
