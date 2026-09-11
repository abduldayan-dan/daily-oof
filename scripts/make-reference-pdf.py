#!/usr/bin/env python3
"""Build the Daily Oof reference PDF."""

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageBreak, PageTemplate, Paragraph, Spacer, Table,
    TableStyle, KeepTogether,
)

OUT = ("/Users/abdul.dayan/Desktop/IS - Design QA/task manager stuff/"
       "Daily-Oof-Reference.pdf")

# --- Nurture palette -------------------------------------------------------
NAVY = colors.HexColor("#0D3764")
ORANGE = colors.HexColor("#E3492B")
GREEN = colors.HexColor("#1B998B")
EGGSHELL = colors.HexColor("#F5F0E3")
LIGHTGRAY = colors.HexColor("#F4F4F4")
POWDER = colors.HexColor("#BADFDB")
MUTED = colors.Color(13 / 255, 55 / 255, 100 / 255, alpha=0.62)

PASTELS = [
    ("pink", "#F5CAC3"), ("rose", "#F2B8CB"), ("salmon", "#F8A978"),
    ("yellow", "#FCCC5D"), ("sand", "#EFE0BC"), ("mint", "#C3E8C0"),
    ("powder", "#BADFDB"), ("cyan", "#97ECF1"), ("sky", "#B2D0FD"),
    ("lavender", "#C9C6EC"), ("purple", "#DBCDF0"), ("stone", "#DCD9D4"),
]

# Serif + mono only. DESIGN.md forbids mixing the mono with a sans-serif, and
# Times/Courier are the closest built-ins to DM Serif Display / Roboto Mono.
SERIF, SERIF_B, MONO, MONO_B = "Times-Roman", "Times-Bold", "Courier", "Courier-Bold"

ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(name=name, fontName=SERIF, fontSize=9.5, leading=14,
                textColor=NAVY, alignment=TA_LEFT)
    base.update(kw)
    return ParagraphStyle(**base)


S = {
    "cover_title": style("ct", fontName=SERIF_B, fontSize=44, leading=46),
    "cover_sub": style("cs", fontName=MONO, fontSize=10, leading=16,
                       textColor=MUTED),
    "h1": style("h1", fontName=SERIF_B, fontSize=20, leading=24,
                spaceBefore=2, spaceAfter=8),
    "h2": style("h2", fontName=SERIF_B, fontSize=13, leading=17,
                spaceBefore=12, spaceAfter=5),
    "body": style("body", spaceAfter=7),
    "muted": style("muted", fontSize=8.5, leading=12.5, textColor=MUTED),
    "mono": style("mono", fontName=MONO, fontSize=8, leading=11.5),
    "mono_sm": style("mono_sm", fontName=MONO, fontSize=7.2, leading=10,
                     textColor=MUTED),
    "cell": style("cell", fontSize=8.6, leading=12),
    "cell_b": style("cell_b", fontName=SERIF_B, fontSize=8.6, leading=12),
    "swatch": style("swatch", fontName=MONO, fontSize=5.6, leading=7,
                    textColor=MUTED),
    "kicker": style("kicker", fontName=MONO, fontSize=7.5, leading=11,
                    textColor=ORANGE),
}

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm
CONTENT_W = PAGE_W - 2 * MARGIN


def decorate(canvas, doc):
    """Hard rule at the top, page number bottom-right. No blur, no rounding."""
    canvas.saveState()
    canvas.setFillColor(ORANGE)
    canvas.rect(MARGIN, PAGE_H - MARGIN + 6, CONTENT_W, 2.2, stroke=0, fill=1)
    canvas.setFont(MONO, 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, MARGIN - 12, "daily oof - reference")
    canvas.drawRightString(PAGE_W - MARGIN, MARGIN - 12, str(doc.page))
    canvas.restoreState()


def cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(EGGSHELL)
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    # brand tile
    canvas.setFillColor(ORANGE)
    canvas.rect(MARGIN, PAGE_H - MARGIN - 34 * mm, 26 * mm, 26 * mm,
                stroke=0, fill=1)
    # pastel bar sweep, echoing the takeover
    x, w = MARGIN, CONTENT_W / len(PASTELS)
    for _, hexv in PASTELS:
        canvas.setFillColor(colors.HexColor(hexv))
        canvas.rect(x, MARGIN + 8 * mm, w, 10 * mm, stroke=0, fill=1)
        x += w
    canvas.restoreState()


def hr(colour=NAVY, thickness=1.6, space_before=4, space_after=8):
    t = Table([[""]], colWidths=[CONTENT_W], rowHeights=[thickness])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colour)]))
    return [Spacer(1, space_before), t, Spacer(1, space_after)]


def kv_table(rows, col1=46 * mm):
    data = [[Paragraph(k, S["cell_b"]), Paragraph(v, S["cell"])]
            for k, v in rows]
    t = Table(data, colWidths=[col1, CONTENT_W - col1])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, colors.HexColor("#D8D4C6")),
    ]))
    return t


def egg_table(rows):
    """#, name, trigger (mono), what happens."""
    head = [Paragraph("<b>#</b>", S["cell_b"]),
            Paragraph("<b>egg</b>", S["cell_b"]),
            Paragraph("<b>trigger</b>", S["cell_b"]),
            Paragraph("<b>what happens</b>", S["cell_b"])]
    data = [head]
    for n, name, trig, what in rows:
        data.append([
            Paragraph(str(n), S["mono"]),
            Paragraph(name, S["cell_b"]),
            Paragraph(trig, S["mono"]),
            Paragraph(what, S["cell"]),
        ])
    widths = [8 * mm, 30 * mm, 42 * mm, CONTENT_W - 80 * mm]
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, 0), POWDER),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.5, NAVY),
    ]))
    return t


def swatch_row():
    top = [Paragraph(f'<font face="{MONO}">{n}</font>', S["swatch"])
           for n, _ in PASTELS]
    t = Table([[""] * len(PASTELS), top],
              colWidths=[CONTENT_W / len(PASTELS)] * len(PASTELS),
              rowHeights=[13 * mm, 6 * mm])
    st = [("GRID", (0, 0), (-1, 0), 0.6, NAVY),
          ("VALIGN", (0, 1), (-1, 1), "TOP"),
          ("ALIGN", (0, 1), (-1, 1), "CENTER"),
          ("TOPPADDING", (0, 1), (-1, 1), 3),
          ("LEFTPADDING", (0, 0), (-1, -1), 1),
          ("RIGHTPADDING", (0, 0), (-1, -1), 1)]
    for i, (_, hexv) in enumerate(PASTELS):
        st.append(("BACKGROUND", (i, 0), (i, 0), colors.HexColor(hexv)))
    t.setStyle(TableStyle(st))
    return t


def P(text, s="body"):
    return Paragraph(text, S[s])


# ---------------------------------------------------------------------------
story = []

# --- cover -----------------------------------------------------------------
story += [Spacer(1, 46 * mm)]
story += [P("daily oof", "cover_title")]
story += [Spacer(1, 3 * mm)]
story += [P("a personal task tracker for the nurture team<br/>"
            "reference and easter egg index", "cover_sub")]
story += [Spacer(1, 8 * mm)]
story += [P("built september 2026 &nbsp;&nbsp;|&nbsp;&nbsp; "
            "daily-oof.netlify.app", "mono_sm")]
story += [PageBreak()]

# --- what it is ------------------------------------------------------------
story += [P("What this is", "h1")]
story += hr()
story += [P(
    "Daily Oof is a personal task and project tracker. Everyone signs in with "
    "their Arbisoft Google account and sees only their own data. It is not a "
    "team board and there is no shared visibility - each person's list is "
    "private to them, enforced by Postgres Row Level Security rather than by "
    "application code.")]
story += [P(
    "The single design goal is capturing a task in under two seconds. Every "
    "other decision in the interface is subordinate to that: the input is "
    "autofocused, it is never inside a modal, Enter alone saves, and choosing "
    "a project is optional because forcing it would break the two-second "
    "target.")]

story += [P("Stack", "h2")]
story += [kv_table([
    ("Framework", "Next.js 15.5 (App Router), TypeScript, React 19"),
    ("Data + auth", "Supabase (Postgres, Google OAuth via PKCE)"),
    ("Client", "@supabase/ssr for cookie-based sessions"),
    ("Styling", "Plain CSS with custom properties. No Tailwind, no CSS-in-JS."),
    ("Hosting", "Netlify"),
    ("Analytics", "PostHog, installed but parked (no token set)"),
])]

story += [P("Why Netlify and not Vercel", "h2")]
story += [P(
    "Vercel's Hobby plan is restricted to non-commercial personal use, and "
    "their fair use policy defines commercial usage to include any deployment "
    "produced by a paid employee. This is a work tool built on work time, so "
    "Hobby is out of policy from day one - the risk being a takedown after "
    "colleagues depend on it, not a bill. Netlify's free plan explicitly "
    "permits commercial projects; the only real restriction is that you may "
    "not resell their hosting.")]
story += [P(
    "Supabase's free tier also permits commercial use. Total running cost is "
    "zero, and no payment method is attached to either account, so there is no "
    "path to a surprise charge.", "muted")]

story += [PageBreak()]

# --- where it lives --------------------------------------------------------
story += [P("Where it lives", "h1")]
story += hr()
story += [kv_table([
    ("Live app", "https://daily-oof.netlify.app"),
    ("Repository", "github.com/abduldayan-dan/daily-oof (private)"),
    ("Supabase project", "lvahxlekhanratmbgcug"),
    ("Local path", "~/Desktop/IS - Design QA/task manager stuff"),
    ("Design preview", "localhost:3000/design-preview (dev only, 404s in prod)"),
])]

story += [P("Environment variables", "h2")]
story += [P(
    "Three, set in <font face=\"Courier\">.env.local</font> locally and under "
    "Site configuration in Netlify. The first two are public by design - they "
    "ship inside the browser bundle, and RLS is what actually protects data.")]
story += [kv_table([
    ("NEXT_PUBLIC_SUPABASE_URL", "The project URL."),
    ("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
     "Replaces the legacy anon key, which Supabase retires end of 2026."),
    ("ALLOWED_EMAIL_DOMAINS", "arbisoft.com - server-side only, never bundled."),
], col1=70 * mm)]
story += [P(
    "Never add the Supabase secret or service_role key. It bypasses RLS, and "
    "everything here runs somewhere a browser can reach.", "muted")]

story += [P("How access is actually gated", "h2")]
story += [P("Three layers, outermost enforced by Google rather than by code:")]
story += [kv_table([
    ("1. Google consent screen",
     "Set to Internal, so Google refuses any non-arbisoft.com account before "
     "the request reaches Supabase or this app."),
    ("2. OAuth callback",
     "Checks the email domain and signs out anything that slips through."),
    ("3. Middleware",
     "Re-checks on every request, so tightening the allow list takes effect "
     "immediately rather than when tokens expire."),
])]
story += [P(
    "Verified directly against the live project: an anonymous caller holding "
    "the publishable key can neither read rows nor write them - the write is "
    "refused with Postgres error 42501, row-level security violation.",
    "muted")]

story += [PageBreak()]

# --- design system ---------------------------------------------------------
story += [P("Design system", "h1")]
story += hr()
story += [P(
    "The visual language is Nurture by Arbisoft, defined in DESIGN.md in the "
    "repo. The rules easiest to break by accident:")]
story += [kv_table([
    ("0px radius", "On everything interactive. The checkbox is a square for "
                   "this reason, not by oversight."),
    ("2px strokes", "Not 1px, not 3px."),
    ("Hard offset shadows", "4px 4px 0, and only on hover or press. Never at "
                            "rest, and never blurred."),
    ("Lowercase UI", "Nav, labels, buttons and tags. Intentional."),
    ("Serif + mono only", "DM Serif Display for headings, Roboto Mono for "
                          "everything else including body. Never add a "
                          "sans-serif."),
])]

story += [P("Project palette", "h2")]
story += [P(
    "Twelve pastels. DESIGN.md defines eight; seven are used as-is and five "
    "were added in the same family. hot-pink is deliberately excluded - it is "
    "not pastel, and DESIGN.md forbids pairing it with brand-orange, which is "
    "exactly the active nav background a project dot sits inside.")]
story += [Spacer(1, 2 * mm), swatch_row(), Spacer(1, 4 * mm)]

story += [P("Deliberate deviations", "h2")]
story += [kv_table([
    ("No automatic dark mode",
     "DESIGN.md does not define one. Inventing a dark palette would take the "
     "product off-brand for anyone whose OS is set dark. Inverted mode exists "
     "instead, behind the konami code - see egg 1."),
    ("Lowercase labels",
     "DESIGN.md contradicts itself: the typography section says labels are "
     "uppercase, the tone rules say all UI copy is lowercase. The tone rule "
     "wins, being stated more emphatically."),
    ("Wordmark, not the leaf mark",
     "The real Nurture mark was never supplied as a file. An approximated "
     "logo is worse than none, so the wordmark is set in the brand serif. "
     "Drop the asset at public/nurture-mark.svg and uncomment one line in "
     "app/brand.tsx."),
])]

story += [PageBreak()]

# --- motion ----------------------------------------------------------------
story += [P("Motion", "h1")]
story += hr()
story += [P(
    "Motion is hierarchical on purpose. Completion is the loud moment; "
    "everything else is deliberately quieter. If the small things compete, "
    "finishing a task stops meaning anything - which was the original brief's "
    "argument for animating nothing else at all.")]
story += [kv_table([
    ("Completion (320ms)",
     "The row winds up left, the checkbox stamps green, a line strikes "
     "through the title, then it releases to the right. Three beats, not one "
     "fade."),
    ("High priority (420ms)",
     "A longer, louder version of the same. The one distinction the list "
     "bothers to make should feel different when you finish it."),
    ("Deletion (220ms)",
     "Collapses downward, deliberately unlike completion's release to the "
     "right, so the two never read as the same event."),
    ("Capture (180ms)",
     "The field presses into its own offset shadow and springs back, like a "
     "stamp. The new row drops in from above."),
    ("Everything else",
     "Ghost tick on checkbox hover, 2px nav lean, priority bar widening, "
     "count ticks, save confirmation flashes, one hard shake on error."),
])]
story += [P(
    "All of it collapses to 1ms under prefers-reduced-motion, and the ambient "
    "loops - empty-state marks, confetti, idle drift - switch off entirely. "
    "Nothing load-bearing depends on an animation finishing.", "muted")]

story += [PageBreak()]

# --- eggs ------------------------------------------------------------------
story += [P("Easter eggs", "h1")]
story += hr()
story += [P(
    "Twenty hidden interactions. They share one piece of infrastructure - a "
    "takeover queue, a nudge slot, and lib/eggs.ts for the pure logic - so "
    "that two full-page moments can never collide and each reaction does not "
    "need its own timer.")]
story += [P(
    "One rule governs all of them: <b>an egg must never look like a bug and "
    "must never eat input.</b> Typing \"oof\" still creates the task. A "
    "duplicate warning leaves your text in the field and saves it on the next "
    "Enter. Nothing is ever lost to a joke - a colleague who triggers one by "
    "accident should never lose work or file a defect.")]

story += [P(
    "Grouped by kind rather than by number, so the numbering jumps around. "
    "The numbers are stable identifiers - use them to refer to a specific egg "
    "without describing it.", "muted")]

story += [Spacer(1, 3 * mm)]
story += [P("Unlocks and secrets", "h2")]
story += [egg_table([
    (1, "Inverted mode",
     "konami code:<br/>up up down down<br/>left right left right<br/>b a",
     "Flips to navy ground with eggshell strokes and pastel accents, and "
     "remembers it. Not invented - DESIGN.md specifies 'Inverted mode: pastel "
     "on solid background', so the reward is a dark theme that was already in "
     "the spec and unused. Repeat to switch back."),
    (2, "oof", "type <b>oof</b> and press Enter",
     "The task is still created, then the page shakes once and answers "
     "\"we've all been there.\""),
    (4, "Palette cycle", "click the orange tile 5 times",
     "Each further click moves the brand tile through the twelve project "
     "pastels."),
    (7, "Lifetime count", "triple-click the task count",
     "Swaps the view count for your all-time finished total for a few "
     "seconds."),
])]

story += [PageBreak()]
story += [P("Full-page moments", "h2")]
story += [P(
    "Four events rare enough to earn the whole screen. Twelve pastel bars "
    "sweep up, a line lands in the serif, everything leaves. Click to skip.",
    "muted")]
story += [egg_table([
    (8, "Nothing left", "clear every open task",
     "Not one view - the entire list. The rarest state in the app, and "
     "previously it got exactly the same treatment as clearing three tasks in "
     "Today."),
    (9, "Good morning", "first open of a calendar day",
     "The date in full, held briefly. Makes the app a morning ritual, which "
     "is the name."),
    (10, "Farewell", "sign out",
     "\"see you tomorrow.\" held for a moment before the redirect. It used to "
     "jump straight to the login page, which read like a crash."),
    (20, "Anniversary", "one year after your first task",
     "Lifetime stats, once ever. Derived from the oldest created_at, so it "
     "needs no extra data."),
])]

story += [Spacer(1, 4 * mm)]
story += [P("Completion reactions", "h2")]
story += [egg_table([
    (5, "Milestone", "every 25th completed task",
     "Page-level confetti and \"25 oofs survived\". Rewards the long game "
     "rather than a single session."),
    (12, "Urgent release", "complete a high-priority task",
     "A longer, louder animation than a routine one."),
    (13, "Combo", "3 completions inside a minute",
     "Chains them: \"3 in a row.\""),
    (14, "That was quick", "complete a task under a minute old",
     "Calls it out."),
    (15, "That took a while", "complete your oldest open task",
     "Shows the age: \"that one took 47 days.\" Quietly the most satisfying "
     "one here."),
    (16, "Undo", "uncheck a task in Done",
     "Plays the completion in reverse and asks \"changed your mind?\" rather "
     "than the row silently reappearing."),
])]

story += [PageBreak()]
story += [P("Capture reactions", "h2")]
story += [egg_table([
    (3, "Impatience", "press Enter on an empty field",
     "The placeholder escalates: \"nothing?\", \"still nothing\", \"take your "
     "time\", \"we can do this all day\", \"fine. i can wait.\""),
    (17, "Duplicate", "re-type a task you already have open",
     "\"you already said that.\" Your text stays put; pressing Enter again "
     "saves it anyway."),
    (18, "On a roll", "capture 5 tasks in 30 seconds",
     "Rewards a brain-dump, which is the behaviour the two-second target was "
     "built for."),
])]

story += [Spacer(1, 4 * mm)]
story += [P("Ambient and tonal", "h2")]
story += [egg_table([
    (6, "The shrug", "a task 30+ days overdue",
     "\"been here a while\" in the metadata. A shrug, not a nag - somebody a "
     "month past a due date does not need the app raising its voice."),
    (11, "Idle drift", "5 minutes untouched",
     "Three pastel squares drift slowly across the page. Clears on any "
     "keypress. The only thing in the app that moves without being asked."),
    (19, "Avalanche", "10 or more overdue",
     "Copy shifts from encouraging to gallows humour: \"12 overdue. no "
     "notes.\", and past 25, \"it's fine. everything's fine.\" Encouragement "
     "stops landing at a certain point; naming it is kinder than pretending."),
])]

story += [Spacer(1, 5 * mm)]
story += [P("Time-aware prompts", "h2")]
story += [P(
    "Not numbered, but worth knowing: the capture placeholder rotates while "
    "the field is empty and knows the hour. Mornings ask \"what's the oof?\", "
    "afternoons \"name the dread\", evenings \"still here?\", and after 9pm it "
    "simply says \"go home\".")]

story += [PageBreak()]

# --- gaps ------------------------------------------------------------------
story += [P("Known gaps", "h1")]
story += hr()
story += [P("Documented rather than hidden, in rough priority order.")]
story += [kv_table([
    ("Unbounded task query",
     "app/page.tsx selects every task ever created on every page load, "
     "including completed ones with full notes. At roughly 20 tasks a week "
     "that is about 1,000 rows within a year, serialised into the HTML each "
     "time. The two-second promise degrades quietly as the payload grows. "
     "Highest-value fix on this list."),
    ("No error reporting",
     "Failures surface inline to whoever hits them and nowhere else. If a "
     "colleague hits a bug they will shrug and stop using it, and you will "
     "never find out. This is the one that quietly kills adoption."),
    ("No search outside Done",
     "Done has search over titles and notes. The open list does not."),
    ("No realtime sync",
     "Two devices drift apart silently; last write wins with no warning."),
    ("Inverted mode is hidden",
     "It is a genuinely usable dark theme reachable only by knowing the "
     "konami code. Worth considering a real toggle, keeping the code as the "
     "fun way in."),
    ("PostHog autocapture",
     "Currently parked. Before switching it on, note that autocapture records "
     "the text of clicked elements - which here means colleagues' task "
     "titles, in a third-party service. Consider "
     "autocapture: { mask_all_text: true }."),
    ("Data custody",
     "Colleagues' task content lives in a Supabase project on a personal "
     "account. Fine for an experiment; worth revisiting if it sticks."),
])]

story += [Spacer(1, 6 * mm)]
story += hr(colour=ORANGE, thickness=2.2)
story += [P(
    "Generated 11 September 2026. Source of truth remains the repository - "
    "BRIEF.md for intent, DESIGN.md for the visual system, SETUP.md for "
    "provisioning, and lib/eggs.ts for the egg logic.", "mono_sm")]

# ---------------------------------------------------------------------------
doc = BaseDocTemplate(OUT, pagesize=A4,
                      leftMargin=MARGIN, rightMargin=MARGIN,
                      topMargin=MARGIN, bottomMargin=MARGIN,
                      title="Daily Oof - Reference",
                      author="Nurture by Arbisoft",
                      subject="Reference and easter egg index")

frame = Frame(MARGIN, MARGIN, CONTENT_W, PAGE_H - 2 * MARGIN, id="f",
              leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)

doc.addPageTemplates([
    PageTemplate(id="cover", frames=[frame], onPage=cover),
    PageTemplate(id="body", frames=[frame], onPage=decorate),
])

# First page uses the cover template; every later page switches to body.
from reportlab.platypus import NextPageTemplate
story.insert(0, NextPageTemplate("body"))

doc.build(story)
print("wrote", OUT)
