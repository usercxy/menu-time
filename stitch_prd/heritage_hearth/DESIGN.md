# Design System Strategy: The Digital Heirloom

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Heirloom."** 

We are moving away from the cold, clinical efficiency of modern recipe apps and instead creating a digital scrapbook that feels lived-in, curated, and precious. The goal is to replicate the tactile satisfaction of flipping through a grandmother’s recipe tin or a hand-bound journal. 

To break the "template" look, this system utilizes **Intentional Asymmetry**. We eschew rigid, center-aligned grids in favor of editorial layouts where images may bleed off-edge or overlap with text cards. By layering `surface-container` tiers and using wide-set typography scales, we create a rhythmic, high-end editorial experience that feels custom-built for every family story.

---

## 2. Colors & Surface Philosophy
The palette is a dialogue between the warmth of the hearth and the freshness of the garden.

- **Primary (`#a84533` - Terracotta):** Used for "Action & Heat." It represents the fire of the kitchen and the heart of the home.
- **Secondary (`#596859` - Sage Green):** Used for "Growth & Freshness." Ideal for categorized tags, herbs, and healthy transitions.
- **Tertiary (`#6e6353` - Earth):** Used for "Structure & Soil." This provides a grounded neutral for secondary information.

### The Rules of Engagement:
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. We define space through "Tonal Shifts." A recipe card (`surface-container-lowest`) sits on a kitchen background (`surface`) to create a boundary through value, not lines.
*   **Surface Hierarchy & Nesting:** Treat the UI as stacked sheets of fine linen paper.
    *   *Base Layer:* `surface` (#fffcf7).
    *   *Sectioning:* `surface-container-low` (#fcf9f3).
    *   *Interactive Cards:* `surface-container-lowest` (#ffffff).
*   **The "Glass & Gradient" Rule:** Floating headers or navigation bars should use **Glassmorphism**. Apply `surface` with 80% opacity and a `backdrop-blur` of 20px. This allows the "ingredients" (content) to peek through, softening the interface.
*   **Signature Textures:** For hero CTAs, use a subtle radial gradient transitioning from `primary` (#a84533) to `primary-dim` (#983a28) to give a sense of depth and "simmer."

---

## 3. Typography: The Editorial Voice
We use a high-contrast pairing to balance nostalgia with modern legibility.

*   **Display & Headlines (Noto Serif):** These are our "Handwritten Journal" moments. They should be used with generous letter-spacing (-0.02em) to feel premium. Use `display-lg` for recipe titles to evoke the feeling of a cookbook cover.
*   **Body & Labels (Plus Jakarta Sans):** Our "Clean Script." This sans-serif provides the clarity needed for long ingredient lists and cooking steps.
*   **The Hierarchy of Emotion:** 
    *   `headline-md` is for storytelling (The "Why" behind the dish).
    *   `title-sm` is for the "How" (Instructional headers).
    *   `label-md` is for the "Details" (Prep time, yield, spice level).

---

## 4. Elevation & Depth: Tonal Layering
Traditional material shadows are too heavy for a nostalgic aesthetic. We use light and layering to imply depth.

*   **The Layering Principle:** Avoid elevation shadows where possible. Instead, place a `surface-container-highest` element inside a `surface-container` to indicate a "pressed-in" or "pasted-on" effect.
*   **Ambient Shadows:** For floating action buttons or modal cards, use an **Organic Shadow**. 
    *   *Recipe:* `0px 12px 32px rgba(55, 56, 49, 0.06)`. This uses a tinted version of `on-surface` rather than pure black, mimicking natural kitchen light.
*   **The "Ghost Border" Fallback:** For accessibility in forms, use `outline-variant` (#babaaf) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: The Scrapbook Elements

### Buttons (The "Seal")
*   **Primary:** Solid `primary` with `xl` (1.5rem) roundedness. They should look like wax seals or stamped labels.
*   **Secondary:** `surface-container-highest` background with `on-surface` text. No border.
*   **Tertiary:** Text-only using `primary` color, bold weight, with a `0.35rem` (spacing-1) underline offset.

### Cards (The "Recipe Box")
*   **Rule:** Forbid divider lines.
*   **Structure:** Use `spacing-6` (2rem) between the image and the text. Use a subtle background shift (`surface-container-low`) to separate the "Ingredients" section from the "Method" section.
*   **Corner Radius:** Use `lg` (1rem) for main cards to feel approachable and soft.

### Inputs (The "Journal Entry")
*   **Style:** Underlined only or subtle `surface-container` fills. 
*   **Focus State:** Transition the underline from `outline-variant` to `primary` with a 300ms ease. Avoid the heavy "box" look.

### The "Heirloom" Components (App Specific)
*   **The "Pasted Note" Tooltip:** Use `tertiary-container` with a slight 2-degree rotation to mimic a sticky note or a scrap of paper tucked into a book.
*   **The "Family Tag" Chip:** Using `secondary-container` with `secondary` text and `full` roundedness. These represent different branches of the family tree.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins. If the left margin is `spacing-4`, try a `spacing-6` on the right for an editorial feel.
*   **Do** use `notoSerif` for numbers in ingredient lists; it makes the quantities feel more "culinary."
*   **Do** embrace white space. If a screen feels crowded, increase your spacing to `spacing-8` or `spacing-10`.

### Don’t:
*   **Don’t** use pure black (#000000). Always use `on-surface` (#373831) to keep the "warmth."
*   **Don’t** use hard corners. Even icons should have a slightly rounded terminal (Round cap/join) to match the `roundedness-md` of the system.
*   **Don’t** use "Drop Shadows" on text. If text is unreadable on an image, use a `surface-dim` gradient overlay instead.

---