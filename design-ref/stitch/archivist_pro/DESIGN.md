# Design System Specification: The Precision Curator

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Precision Curator."** 

In the world of creative asset management, the UI must never compete with the assets it houses. Instead of a generic "dashboard" look, we are building a high-end, editorial workspace that feels like a physical gallery archive—utilitarian yet sophisticated. We break the traditional "bootstrap" template by utilizing **Architectural Density**: a layout strategy that favors intentional asymmetry, rigorous tonal layering instead of lines, and high-contrast typography scales. 

This system moves away from "soft and bubbly" web trends. We embrace sharp, professional edges and a deep, authoritative color palette to signal efficiency and high-stakes data management.

---

## 2. Colors: Tonal Architecture
The palette is anchored in deep blues (`primary`: `#073370`) and clean, neutral surfaces. To achieve a signature look, we move beyond flat UI.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or containers. Separation must be achieved exclusively through background color shifts or subtle tonal transitions. For example, a sidebar should be `surface_container_low`, while the main stage is `surface`.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the `surface_container` tiers to create depth:
- **Base Level:** `surface` (#f8f9fa) – The primary canvas.
- **Structural Nesting:** Use `surface_container_low` (#f3f4f5) for large organizational zones like sidebars or navigation headers.
- **Focused Elements:** Use `surface_container_lowest` (#ffffff) for cards or data cells sitting *inside* a lower-tier container to create a soft, natural lift.

### The Glass & Gradient Rule
To provide a "visual soul" to a data-heavy tool:
- **Floating Elements:** Use Glassmorphism for overlays and context menus. Apply `surface_variant` at 80% opacity with a `20px` backdrop blur.
- **Signature Textures:** Main CTAs should use a subtle linear gradient (Top-Left to Bottom-Right) transitioning from `primary` (#073370) to `primary_container` (#284a88). This creates a "machined" look that feels premium.

---

## 3. Typography: The Editorial Engine
We utilize a dual-typeface strategy to balance brand authority with data clarity.

- **Display & Headlines (Manrope):** Use Manrope for all `display` and `headline` tokens. Its geometric yet approachable form provides a modern, editorial feel. Use high-contrast sizing (e.g., `display-lg` vs `headline-sm`) to guide the user’s eye through complex file hierarchies.
- **Utility & Data (Inter):** Use Inter for all `title`, `body`, and `label` tokens. Inter is specifically engineered for readability in dense tables and small file metadata.
- **The Label Strategy:** Use `label-sm` (0.6875rem) in all-caps with `0.05rem` letter-spacing for metadata headers in tables. This conveys a "technical blueprint" aesthetic.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often messy in data-centric tools. We achieve hierarchy through **Tonal Layering**.

- **The Layering Principle:** Depth is achieved by "stacking." A `surface_container_highest` element placed on a `surface` background creates immediate focus without a single line or shadow.
- **Ambient Shadows:** When a "floating" effect is required (e.g., a file preview popover), use an extra-diffused shadow: `0px 12px 32px rgba(7, 51, 112, 0.08)`. Notice the shadow is tinted with our `primary` blue to mimic natural light reflection.
- **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., in a high-density grid), use the "Ghost Border": `outline_variant` (#c3c6d4) at **15% opacity**. Never use 100% opaque lines.

---

## 5. Components: Precision Primitives

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`), `0.25rem` radius. Use `on_primary` (#ffffff) for text.
- **Secondary:** `surface_container_high` fill with `on_surface` text. No border.
- **Tertiary:** Text-only using `primary` color, bold weight, with a `0.2rem` underline on hover.

### Data Tables (The Core Component)
- **Forbid Dividers:** Do not use lines between rows. 
- **The "Shift" Pattern:** Use a vertical space of `spacing.2` (0.4rem) between rows. Use `surface_container_low` as a full-row background on `:hover`.
- **Typography:** Filenames use `title-sm` (Inter, 1rem); metadata uses `label-md` (Inter, 0.75rem) with `on_surface_variant` color.

### Asset Cards
- **Geometry:** `0.25rem` (sm) rounding for the container. The minimal roundness reinforces the professional, tool-like feel.
- **Structure:** The image/preview is flush to the top. Metadata is housed in a `surface_container_lowest` footer area to separate it from the asset itself.

### Input Fields
- **Default State:** Background: `surface_container_low`. Bottom border only: `2px` of `outline_variant`.
- **Focus State:** Bottom border shifts to `primary`. Background remains stable. This reduces visual "jumping" in complex forms.

---

## 6. Do's and Don'ts

### Do:
- **Use White Space as a Separator:** Leverage the spacing scale (`spacing.8` or `12`) to separate major logical groups.
- **Prioritize Data:** Ensure `on_surface` (#191c1d) is used for primary data points to maintain a high contrast ratio.
- **Embrace Asymmetry:** In the dashboard view, allow for asymmetrical column widths (e.g., a 30% metadata panel vs. a 70% content stage) to create an editorial layout.

### Don'ts:
- **Don't use 100% Black:** Always use `on_surface` (#191c1d) for text. Pure black (#000) feels "cheap" and vibrates against white.
- **Don't Over-Round:** Stick strictly to the `DEFAULT` (0.25rem) or `none` (0px) for functional components. High rounding (xl or full) is reserved only for status chips or circular avatars.
- **Don't use Dividers:** If you feel the need to add a line, try adding `spacing.4` (0.9rem) or a background color shift first.