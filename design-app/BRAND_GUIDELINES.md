# All Catholic Media App Brand Guide

## 1. Brand Foundation

**Brand name:** All Catholic Media

**Promise:** A trusted digital Catholic home where people can watch, listen, read, pray, and belong.

**Tagline:** One faith. One family. One place.

**Mission language:** Watch. Learn. Pray.

The app is an extension of Fr. Morson Livingston's ministry and the All Catholic Media website. It should feel reverent, welcoming, credible, and contemporary. It is a faith community, not a generic social network or a news-feed app.

Use language that is warm, clear, and invitational:

- "Pray with the community"
- "Share a reflection"
- "Continue watching"
- "Support the mission"
- "A place for faith, family, and hope"

Avoid language that feels commercial, competitive, or engagement-driven, such as "go viral," "trending now," or "grow your followers."

## 2. Visual Identity

Use the existing website palette and typography as the single source of truth. These values are taken from the published All Catholic Media brand stylesheet.

| Token | Value | Use |
| --- | --- | --- |
| Navy | `#0D1F3C` | Primary brand color, headings, app bars, dark surfaces |
| Deep navy | `#060E1D` | Hero backgrounds and immersive Watch/Listen screens |
| Mid navy | `#172B49` | Secondary dark surfaces |
| Catholic gold | `#C9A227` | Primary calls to action, active highlights, sacred accent |
| Gold hover | `#A88520` | Pressed/hover state for gold controls |
| Mission blue | `#046BD2` | Links, secondary actions, informational states |
| Crimson | `#9B1C1C` | Destructive actions and warnings only; never decorative |
| Surface | `#FFFFFF` | Main light background |
| Soft surface | `#F0F4FB` | Grouped content and quiet panels |
| Border | `#DCE4F0` | Dividers and input borders |
| Body text | `#475569` | Long-form copy |
| Muted text | `#718096` | Metadata, timestamps, and supporting labels |

### Color rules

- Use navy as the main visual anchor and gold sparingly as the sign of invitation, prayer, support, or selected state.
- Use gold buttons with deep navy text, not white text.
- Never use gold for long paragraphs or small metadata; it does not provide enough contrast on light backgrounds.
- Use a light theme by default. Offer a dark theme with `#131B2E` surfaces, but retain the same navy/gold identity.
- Avoid gradients unless they are subtle navy-to-deep-navy backgrounds with a restrained gold glow, matching the site heroes.

### Typography

- **Display and editorial headlines:** Playfair Display, bold. Use for page titles, saint names, Scripture, reflection titles, and key campaign language.
- **UI and body text:** Inter, regular through bold. Use for navigation, buttons, forms, captions, and readable article copy.
- Do not introduce another font family. Keep the contrast between the literary serif and clear sans-serif.

### Shape and motion

- Use an 8px base spacing unit: 8, 12, 16, 24, 32, 48.
- Use 8px radii for controls, 12px for cards, and 16px for large feature panels.
- Cards use thin `#DCE4F0` borders and a soft navy shadow. They should feel calm and editorial, not glossy.
- Keep motion gentle: 150-250ms fade, lift, or slide transitions. Respect reduced-motion settings.
- Provide a visible gold focus ring around interactive controls.

## 3. App Structure

The first-level navigation should reflect the ministry, not the website's full menu:

| Tab | Purpose | Main content |
| --- | --- | --- |
| Home | Personal starting point | Live content, daily Rosary, saint, latest news, continue where you left off |
| Explore | The media library | Watch, Listen, Read, Saints, search, saved content |
| Pray | Private and communal prayer | Submit requests, pray for others, daily prayer, prayer updates |
| Community | Faithful conversation | Member posts, comments, reflections, parish/group prompts |
| Profile | Personal account | Sign in, notifications, saved items, posts, donation history, settings |

Place a persistent **Live** indicator at the top of Home when a stream is active. Use a red dot plus the word "LIVE"; do not rely on color alone.

Make **Donate** a clear but non-intrusive action in Profile and in relevant ministry moments, such as after a prayer campaign or at the end of a reflection. Use "Support the Mission," not pressure-oriented copy.

## 4. Core Screen Patterns

### Content: Read, Watch, Listen

- Every item needs a clear content type label, title, source, date, duration or reading time, and a save action.
- Make Watch, Listen, and Read visually distinct through an icon and label, not through unrelated color systems.
- Use large editorial imagery, but keep type legible over it with a dark navy overlay when necessary.
- For third-party or syndicated material, display the original source and link clearly.
- A content detail screen should prioritize the media or article first, then title, description, source, actions, and discussion.

### Authentication

- Let visitors browse public media and saints without an account.
- Ask for sign-in only when someone wants to comment, publish a post, save content across devices, submit a prayer request, or donate.
- Keep registration simple: name, email, password, and acceptance of community guidelines and privacy policy.
- Use supportive prompts such as "Join the All Catholic Media family" rather than "Create an account."

### Community posts and comments

- Member content must be clearly marked as community content, separate from All Catholic Media editorial content.
- Use a composed prompt: "Share a reflection, encouragement, or prayer." Avoid an empty, social-media-style "What's on your mind?"
- Posts support text and one image initially. Do not launch direct messages, public follower counts, reposts, or reaction-count ranking in version one.
- Comments should support reply, report, edit, and delete for the author. Default to chronological order.
- Add report reasons: harmful content, harassment, misinformation, spam, and other.

### Prayer requests

- Offer visibility choices before submit: **Only me**, **Prayer team**, or **Community**.
- Explain who can see each option in plain language.
- Never show prayer requests in a public feed by default. The default should be "Prayer team" or "Only me."
- Let people tap "I prayed for this" without exposing private details.
- Do not allow comments on private requests. For community-visible requests, use prayerful responses rather than open-ended debate.
- Include an urgent-help notice: the app is not an emergency service; provide appropriate local crisis or emergency guidance based on the user's country where possible.

### Donations

- Present donation as mission support, with a short explanation of impact and a secure-payment trust note.
- Offer one-time and recurring giving, preset amounts, a custom amount, and receipt/history in Profile.
- Keep card data out of the app backend by using a compliant payment provider's hosted or native payment flow.
- Never place donations behind an account requirement unless the payment provider requires it.

## 5. Trust, Safety, and Moderation

Trust is part of the brand. Build these requirements into the first release:

- Publish community guidelines before the first post can be created.
- Require report, block, moderation queue, and admin removal tools before enabling public posts or comments.
- Let moderators hide content immediately, record a reason, and review appeals.
- Use human review for prayer requests flagged as self-harm, abuse, threats, or medical/legal emergency content. Do not present automated answers as pastoral or professional advice.
- Protect personal information: do not expose email addresses, phone numbers, exact locations, or donation data in posts, comments, or prayer requests.
- Clearly label All Catholic Media editorial posts, partner content, and member posts.

## 6. Accessibility and Inclusion

- Meet WCAG AA contrast requirements. Test all text and controls in light and dark themes.
- Use 44x44px minimum tap targets.
- Provide captions and transcripts for video; transcripts, playback speed, and background playback for audio.
- Support Dynamic Type / larger text without clipping key content.
- Give every image meaningful alt text; mark decorative images as decorative.
- Do not communicate state through color alone. Pair labels or icons with Live, success, warning, and selected states.

## 7. Product Voice Examples

| Moment | Preferred copy |
| --- | --- |
| Sign in | "Welcome back to your faith community" |
| Registration | "Join the All Catholic Media family" |
| Empty saved list | "Save reflections, videos, and prayers to return to them anytime." |
| Prayer submit | "Your prayer matters. Choose who may pray with you." |
| Community composer | "Share a reflection, encouragement, or prayer." |
| Donation CTA | "Support the mission" |
| Report confirmation | "Thank you. Our team will review this with care." |

## 8. Design Guardrails

- Keep the existing All Catholic Media logo unchanged. Request approved light and dark logo exports before implementation.
- Do not use religious imagery as decoration only. Use it with context, respect, and clear attribution where required.
- Do not make community metrics the visual focus. The app should reward participation and prayer, not popularity.
- Do not use intrusive pop-ups, countdown pressure, autoplay audio, or donation guilt language.
- Keep Fr. Morson's name and voice prominent only in founder/editorial contexts; do not imply personal endorsement of every member post.

## 9. Recommended Launch Order

1. Public Read, Watch, Listen, Saints, Live, search, and saved content.
2. Account registration, comments on editorial content, reporting, and moderation tools.
3. Prayer requests with private and prayer-team visibility controls.
4. Member posts and a moderated Community tab.
5. Secure one-time and recurring donations.

This order protects the ministry's trust before expanding social features.
