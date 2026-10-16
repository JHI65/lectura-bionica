// English guides. Same ids and structure as the Spanish ones; not literal
// translations: references are adapted for English-speaking readers.
// Same editorial rules: say what the tool really does, including its limits,
// and make no clinical claims.

import { config } from '../lib/state/config';
import type { SeoPage } from './seo-pages';

const UPDATED = `October 16, 2026`;
const MAX_MB = config.maxFileMb;

export const GUIDES_EN: SeoPage[] = [
  {
    id: 'guide-what',
    h1: `What is bionic reading?`,
    intro: `Bionic reading is a way of presenting text in which the beginning of each word is shown in bold and the rest with less weight or contrast. The idea is to give the eye visual anchor points so it moves along the line more easily. It is a formatting option: it is not a treatment or a therapeutic method.`,
    updated: UPDATED,
    sections: [
      {
        heading: `Where it comes from`,
        paragraphs: [
          `The format spread around 2022 through a reading app created by the Swiss designer Renato Casutt, and it became popular because it could turn any text into this style. “Bionic Reading” is a registered trademark of its owners. This website is not affiliated with them and uses “bionic reading” as a descriptive term for the format.`,
        ],
      },
      {
        heading: `How it works in this tool`,
        paragraphs: [`For each word, the first letters are shown in bold and the rest in a softer tone. The rules are simple and you can adjust them:`],
        list: [
          `Words of 1 to 3 letters: only the first letter is bolded (in “the”, just the “t”).`,
          `Longer words: the share you choose is bolded, between 20% and 80% of the letters (50% by default), rounded up. At 50%, “reading” gets “read” in bold and “paragraph” gets “parag”.`,
          `Intensity (soft, medium or high) controls how much the rest of each word is dimmed: the higher it is, the more contrast between the start and the end.`,
          `Punctuation, numbers, accents and links are left untouched.`,
        ],
      },
      {
        heading: `The text does not change`,
        paragraphs: [
          `The conversion only changes presentation. The words, their order and the punctuation are exactly those of the original. For EPUBs, before offering the download the tool checks that the text of every chapter is identical to the source; if it were not, the file is not generated.`,
        ],
      },
      {
        heading: `What the evidence says`,
        paragraphs: [
          `It is worth being clear: there is no solid evidence that this format increases reading speed or improves comprehension in general. The comparisons published so far have not shown consistent improvements over normal text, and experience varies a lot from person to person.`,
          `What you do see in practice is that some people find it more comfortable, less dense, or easier to pick up again after a distraction, while others find it gets in the way. That is why it is offered here as a personalization option you can turn on, adjust or turn off at any time.`,
        ],
      },
      {
        heading: `What it is not`,
        paragraphs: [`To avoid misunderstandings:`],
        list: [
          `It is not a treatment for ADHD, dyslexia or any other condition.`,
          `It does not replace an assessment or the support a professional may recommend.`,
          `It does not guarantee you will read faster or understand more.`,
          `It does not change the content of your documents.`,
        ],
      },
      {
        heading: `How to try it properly`,
        paragraphs: [`If you want to know whether it works for you, a short exercise is more reliable than a first impression:`],
        ordered: true,
        list: [
          `Pick a passage from something you usually read, about five minutes long.`,
          `Read it first with bionic reading turned off (the “Bold the start of words” switch).`,
          `Then read it with it on, at medium intensity and 50% of letters.`,
          `Notice how you feel: effort, comfort and whether you want to keep going. Do not time yourself; speed is not the point.`,
          `Try other combinations. Too much bold tends to be tiring; many people prefer a soft intensity.`,
          `Keep what feels comfortable. If nothing helps, you can leave it off: it is a tool, not an obligation.`,
        ],
      },
      {
        heading: `When it may not suit you`,
        paragraphs: [
          `The format adds little to text that is not continuous prose, such as tables, code, formulas or lists of data, and it can distract when the highlighting competes with other elements on the page. If it tires you or makes you re-read, turn it off.`,
        ],
      },
    ],
    faq: [
      {
        q: `Does it help with ADHD?`,
        a: `There is no solid evidence that it improves reading in general for people with ADHD. Some people say they find it more comfortable and others notice no difference. If reading is persistently difficult, talk to a professional.`,
      },
      {
        q: `What about dyslexia?`,
        a: `There is no solid evidence there either. For some people, other adjustments help more, such as larger line height, more letter spacing, a moderate line width or a less bright background. They are covered in the typography guide.`,
      },
      {
        q: `Why is part of each word grey?`,
        a: `That is the contrast controlled by the intensity setting. Dimming the rest of the word makes the start stand out. If you do not like it, lower the intensity or turn the bolding off.`,
      },
    ],
    cta: { label: `Try it with my document` },
  },
  {
    id: 'guide-epub',
    h1: `Convert an EPUB to bionic reading`,
    intro: `You can turn an EPUB into bionic-style reading and download a new EPUB with the same content and the start of each word highlighted. The conversion happens in your browser: the book is never uploaded to a server.`,
    updated: UPDATED,
    sections: [
      {
        heading: `Why EPUB is the best format for this`,
        paragraphs: [
          `An EPUB is a “reflowable” e-book: the text re-wraps to fit your screen, and your reader lets you change the font and the line spacing. Inside, it is a compressed file with the chapters in XHTML, the images, the style sheets and a table of contents. That structure lets us apply the formatting chapter by chapter without touching the text or losing the organization of the book.`,
          `If you have the same book as an EPUB and as a PDF, the EPUB will give a much better result.`,
        ],
      },
      {
        heading: `Step by step`,
        paragraphs: [],
        ordered: true,
        list: [
          `On the home page, drag your EPUB into the upload area or click to choose it.`,
          `The tool checks that it is a valid EPUB and does not exceed ${MAX_MB} MB. You will see progress and can cancel.`,
          `Review the preview. Use the selector to jump from chapter to chapter.`,
          `Adjust the reading: share of bold letters, intensity, typeface, size, line height, spacing, width and theme. Changes show instantly.`,
          `Click “Download transformed EPUB”. The file is named like the original with “-bionic-reading” at the end.`,
          `Copy it to your e-reader or reading app as you would any other book.`,
        ],
      },
      {
        heading: `What is kept from the book`,
        paragraphs: [`The downloaded EPUB is your book with the formatting applied. Specifically:`],
        list: [
          `Reading order, chapters and headings.`,
          `Paragraphs, lists, links, emphasis and semantic structure.`,
          `Embedded images, exactly as they were (they are not recompressed or modified).`,
          `Metadata, table of contents, fonts and the original style sheets.`,
          `The typography you chose is added as an extra style sheet, without replacing the book's own.`,
        ],
      },
      {
        heading: `What it cannot do`,
        paragraphs: [],
        list: [
          `Books with DRM or encrypted content: the tool detects them and refuses. It does not remove protections.`,
          `Chapters that are not strict XHTML: they are kept untransformed and you are told which ones.`,
          `Fixed-layout books (comics, illustrated albums): they contain mostly images and there is no text to transform.`,
          `In the preview, very large photos are downsized so the page stays smooth and SVG covers are shown as an image; the downloaded file keeps the originals.`,
          `Files over ${MAX_MB} MB.`,
        ],
      },
      {
        heading: `How we check the book comes out intact`,
        paragraphs: [
          `After generating the EPUB, the tool opens it again and verifies three things: that the container is valid and keeps its structure, that every transformed chapter is well-formed XML, and that the text of each chapter is identical to the original. If any of those checks fails, the download is not offered and you see a message with the reason.`,
          `For safety, any script embedded in the book is removed from the result: an EPUB does not need to run code to be read.`,
        ],
      },
      {
        heading: `Where to open the result`,
        paragraphs: [
          `The file is a standard EPUB and should open in the usual readers, such as Apple Books, Kobo or Google Play Books, and in reading apps on Android and desktop. Amazon also accepts EPUB through “Send to Kindle”; how it looks will depend on your device.`,
          `One caveat: some older or very basic readers ignore the dimming of the contrast and only show the bold. If that happens it still works; you just will not see the grey part.`,
        ],
      },
    ],
    faq: [
      {
        q: `Do I keep my highlights and bookmarks?`,
        a: `Annotations are usually stored in your reader, not in the file. To the reader, the converted EPUB is a different book, so it will start without them. If they matter, keep the original too.`,
      },
      {
        q: `Can I convert an EPUB I already converted?`,
        a: `Yes. The tool detects the previous bolding, removes it and applies your current settings, and tells you the book had already been converted.`,
      },
      {
        q: `Can I convert books I bought?`,
        a: `If they have no DRM, yes, for your personal use. Always respect copyright and the terms of the store where you bought them.`,
      },
    ],
    cta: { label: `Convert an EPUB` },
  },
  {
    id: 'guide-pdf',
    h1: `Convert a PDF to bionic reading`,
    intro: `If your PDF contains selectable text, you can reformat it into bionic-style reading and download a new PDF. The result is a reconstruction from the text, not an identical copy of the original, so it helps to know what is kept and what is not.`,
    updated: UPDATED,
    sections: [
      {
        heading: `Why a PDF is different from an EPUB`,
        paragraphs: [
          `A PDF does not store paragraphs or chapters: it stores where each piece of text sits on each page, so it looks the same on any device. That is perfect for printing, but it means that to apply new formatting the text first has to be reconstructed from those positions.`,
        ],
      },
      {
        heading: `How the text is reconstructed`,
        paragraphs: [`The tool goes through the document page by page and follows these steps:`],
        ordered: true,
        list: [
          `It extracts the text fragments with their position and size.`,
          `It groups them into lines according to their height on the page.`,
          `It joins lines into paragraphs when the vertical gap is the usual one, and starts a new paragraph when there is a larger gap.`,
          `It detects headings by their larger font size and list items by their bullets or numbering.`,
          `It rejoins words split with a hyphen at the end of a line.`,
          `It drops stand-alone page numbers.`,
        ],
      },
      {
        heading: `What works well and what does not`,
        paragraphs: [`The result depends a lot on the type of document:`],
        list: [
          `It works well with single-column documents: novels, essays, articles and documents exported from a word processor.`,
          `It works less well with two or more columns, tables, footnotes, formulas, forms, slide decks and heavily designed publications, where the reading order may be wrong.`,
          `Embedded images (photos, illustrations, figures) are included in their place between paragraphs, rasterized and downsized if they are very large. Vector graphics (drawn with strokes), links and scans that act as the page background are not kept.`,
        ],
      },
      {
        heading: `What the downloaded PDF looks like`,
        paragraphs: [],
        list: [
          `A4 size, with the title and page number in the footer.`,
          `Standard PDF fonts (Helvetica, Times or Courier, depending on the typeface you choose) at your size and line height.`,
          `Always a white background, meant for printing; the dark or sepia theme only applies to the preview.`,
          `Letter spacing is not applied in the PDF.`,
          `Characters outside the extended Latin alphabet (for example Cyrillic or Chinese) cannot be represented with those fonts: they are replaced with “?” and the tool tells you. EPUBs do not have this limitation.`,
        ],
      },
      {
        heading: `How to tell if your PDF has text`,
        paragraphs: [
          `Open it and try selecting a word with the mouse or your finger. If only that word highlights, there is text. If nothing gets selected, or the whole page is selected as if it were an image, it is a scan. You can also search for a word with Cmd/Ctrl + F.`,
          `If it is a scan, the tool will say so instead of producing an empty result. The guide on scanned PDFs explains what to do.`,
        ],
      },
      {
        heading: `Limits`,
        paragraphs: [],
        list: [
          `Maximum of ${MAX_MB} MB per file.`,
          `Up to 2,000 pages; if the document has more, the first 2,000 are processed and you are told.`,
          `Password-protected and damaged PDFs are not supported.`,
        ],
      },
      {
        heading: `Tips for a better result`,
        paragraphs: [],
        list: [
          `If you have the original document in Word, Docs or EPUB, convert it from there: it is more reliable than starting from a PDF.`,
          `Check the preview before downloading, especially if the document has columns or tables.`,
          `If the reading order comes out wrong, no setting will fix it: the PDF does not contain that information.`,
        ],
      },
    ],
    faq: [
      {
        q: `Why does the file size differ from the original?`,
        a: `Because it is built from scratch from the text and the embedded images, without the internal structure of the original. It can be much smaller or, with many pages of text or images, somewhat larger.`,
      },
      {
        q: `Are the PDF's links lost?`,
        a: `Yes. The text and the embedded images are extracted: the links and bookmarks of the original PDF are not kept.`,
      },
    ],
    cta: { label: `Convert a PDF` },
  },
  {
    id: 'guide-typography',
    h1: `Customize typography for easier reading`,
    intro: `Changing the size, the typeface and the spacing can make a text more comfortable to read. What works depends on the person, the screen and the light, so this guide offers starting points and a way to find your own.`,
    updated: UPDATED,
    sections: [
      {
        heading: `There is no universal setting`,
        paragraphs: [
          `What feels comfortable changes with the person, the device, the distance, the lighting and the type of text. So treat any number as a starting point and adjust from there. Changes show instantly in the preview, and your settings are remembered in your browser.`,
        ],
      },
      {
        heading: `Font size`,
        paragraphs: [
          `The default size is 18 px, which is usually comfortable on a screen at normal distance. Raise it if you squint or lean toward the screen, and lower it if you have to keep moving your eyes. An excessive size also tires you, because it forces more line changes.`,
        ],
      },
      {
        heading: `Line height`,
        paragraphs: [
          `A line height between 1.5 and 1.8 is a common starting point for long texts. More space between lines makes it easier not to lose your place when jumping to the next line; too much makes the paragraph look scattered.`,
          `The WCAG 2.1 web accessibility guidelines (success criterion 1.4.12) state that content must stay readable when the user applies a line height of at least 1.5 times the font size, and the tool allows that comfortably.`,
        ],
      },
      {
        heading: `Letter spacing`,
        paragraphs: [
          `A little extra space between letters (0.01 to 0.05 em) can ease the feeling of cramped text. Beyond that, words start to fall apart and reading gets harder. The same WCAG guidelines expect text to hold up to 0.12 em, but that is a tolerance margin, not a recommended value.`,
        ],
      },
      {
        heading: `Line width`,
        paragraphs: [
          `In typography, a range of 45 to 75 characters per line is often cited as comfortable. Very long lines force the eyes to travel too far, and sometimes you lose your place going back to the start; very short lines fragment the text. The tool offers three widths: narrow (about 45 characters), medium (about 66) and wide (about 90).`,
        ],
      },
      {
        heading: `Typeface`,
        paragraphs: [
          `There are three options: sans-serif (no serifs), serif (with serifs) and monospaced. There is no clear scientific consensus on which is best for everyone: the most reliable approach is to pick the one that feels familiar and comfortable. Monospaced, with letters of constant width, is useful for code and feels less natural for long reading.`,
          `The typefaces are the system ones, so the exact look depends on your device.`,
        ],
      },
      {
        heading: `Contrast and theme`,
        paragraphs: [
          `Black text on a pure white background is very high contrast, and some people find it dazzling, especially in bright light or over long sessions. The sepia theme softens it, and dark is usually more comfortable in low light. More contrast is not always better: look for the level at which you can read without effort or discomfort.`,
        ],
      },
      {
        heading: `How to find your setting`,
        paragraphs: [],
        ordered: true,
        list: [
          `Load a text you read regularly.`,
          `Start with the default values.`,
          `Change one setting at a time, so you know what effect it has.`,
          `Read for about five minutes with each change before deciding.`,
          `Note what works best and revisit it in other conditions, by day and at night.`,
          `If you get lost, the “Reset settings” button takes you back to the starting values.`,
        ],
      },
      {
        heading: `What is applied when you export`,
        paragraphs: [],
        list: [
          `In an EPUB, your typography is added as a style sheet, without replacing the book's own. The theme (light, sepia or dark) is not imposed, to respect your reader's mode.`,
          `In a PDF, the typeface, size and line height are applied; the background is always white and letter spacing is not applied.`,
        ],
      },
    ],
    faq: [
      {
        q: `Which typeface is best for dyslexia?`,
        a: `There is no typeface proven to be better for everyone with dyslexia. Some people find a sans-serif with good spacing and generous line height helps; others do not. Try a few and keep what works, and talk to a professional if you need to.`,
      },
      {
        q: `Are my settings saved?`,
        a: `Yes, in your own browser and only on your device. They are not sent to any server.`,
      },
    ],
    cta: { label: `Adjust my reading` },
  },
  {
    id: 'guide-accessibility',
    h1: `Reading accessibility tools`,
    intro: `Reading comfortably does not depend on a single tool. Combining the document format, typography, contrast and, if it helps you, text-to-speech lets you adapt each text to what you need at that moment.`,
    updated: UPDATED,
    sections: [
      {
        heading: `Why combine several`,
        paragraphs: [
          `Each tool solves one part: the format, the size, the contrast, the pace, or the way you receive the text. What helps one person gets in another's way, so the sensible approach is to try each option on its own and keep the ones that add something.`,
        ],
      },
      {
        heading: `Document format: EPUB or PDF`,
        paragraphs: [
          `An EPUB is reflowable: the text re-wraps and you can change the font, line spacing and margins. A PDF has a fixed layout: you can only zoom. If a book is available in both formats and you want to personalize reading, the EPUB is almost always the better choice.`,
        ],
      },
      {
        heading: `Your e-reader's settings`,
        paragraphs: [
          `Apps such as Apple Books, Kobo or Google Play Books let you change the font size and typeface and choose among several themes; some also include line spacing and margins. It is worth exploring those menus before looking for other solutions, because they are already there.`,
        ],
      },
      {
        heading: `Text-to-speech`,
        paragraphs: [
          `Operating systems include features that make the device read text aloud: Spoken Content and VoiceOver on iPhone, iPad and Mac, Select to Speak and TalkBack on Android, and Narrator on Windows, among others. Names and locations in the settings change with each version. It is a useful alternative for people who prefer listening or who want to alternate between reading and listening.`,
        ],
      },
      {
        heading: `Your browser's reading mode`,
        paragraphs: [
          `Safari, Firefox and Edge have a reading mode that removes menus and ads and lets you change the font and background of a web page. Edge's Immersive Reader also adds read-aloud and line focus.`,
        ],
      },
      {
        heading: `Contrast and dark mode`,
        paragraphs: [
          `Dark mode or the system's color filters reduce brightness and glare. In this tool you can also choose between a light, sepia and dark theme in the preview.`,
        ],
      },
      {
        heading: `Bionic reading: one more option`,
        paragraphs: [
          `Bionic reading is one more option within this set. There is no solid evidence that it improves reading in general, so it is best treated as a tool you try and drop if it adds nothing.`,
        ],
      },
      {
        heading: `When to seek professional support`,
        paragraphs: [
          `If reading is persistently difficult, a professional can guide you better than any tool: an optometrist for vision, a speech-language pathologist or educational psychologist for reading difficulties, or your doctor as a first step. These tools are a complement, not a replacement.`,
        ],
      },
      {
        heading: `Privacy when adapting documents`,
        paragraphs: [
          `Many documents are personal or work-related, and some online tools upload them to a server to process them. Here, the conversion happens in your browser. You can check it: open your browser's developer tools, go to the network tab, and you will see that the file is not sent anywhere. More details in the privacy policy.`,
        ],
      },
    ],
    faq: [
      {
        q: `Is it better to read or to listen?`,
        a: `It depends on the person and the situation. Listening frees your eyes and can help people who tire when reading, while reading lets you go at your own pace and go back easily. Many people alternate.`,
      },
      {
        q: `Do these tools cost anything?`,
        a: `The system and browser features mentioned are included. Conversion on this website is free.`,
      },
    ],
    cta: { label: `Adapt a document` },
  },
  {
    id: 'guide-ocr',
    h1: `Scanned PDF: how to tell and what to do`,
    intro: `If, when you upload a PDF, the tool says it has no selectable text, it is most likely a scan: an image of each page. This guide explains how to check that and what options you have to turn it into a document with real text.`,
    updated: UPDATED,
    sections: [
      {
        heading: `What a scanned PDF is`,
        paragraphs: [
          `When a book or a paper is scanned, the result is usually a PDF containing a photograph of each page. To you it looks like text, but to the computer it is an image: there are no words to search, copy or transform. That is why bionic reading cannot be applied directly.`,
        ],
      },
      {
        heading: `How to check whether your PDF has text`,
        paragraphs: [],
        ordered: true,
        list: [
          `Open it in your usual PDF reader.`,
          `Try to select a word with the mouse or your finger.`,
          `If only that word highlights, the document has text. If nothing gets selected, or the whole page is selected as one block, it is an image.`,
          `Also try searching for a word with Cmd/Ctrl + F: if it finds nothing that you know is there, it is a scan.`,
        ],
      },
      {
        heading: `Mixed documents`,
        paragraphs: [
          `Some PDFs mix pages with text and scanned pages. In that case the tool processes the ones with text and tells you how many pages had selectable content; the rest are skipped.`,
        ],
      },
      {
        heading: `What OCR is`,
        paragraphs: [
          `OCR stands for optical character recognition: a program analyzes the image of each page and identifies the letters to produce real text. After OCR, the PDF has a selectable text layer and can be used with the tool.`,
        ],
      },
      {
        heading: `Options for doing OCR`,
        paragraphs: [`There are several routes, with different results and prices. None is perfect:`],
        list: [
          `Adobe Acrobat includes a text recognition feature, but it is paid.`,
          `OCRmyPDF is a free, open-source tool built on Tesseract that adds the text layer to a scanned PDF. It is used from the command line.`,
          `Some phone scanner apps produce PDFs with recognized text directly when you scan.`,
          `Google Drive can recognize text in images and scanned PDFs when you open them with Google Docs. Quality varies with the document.`,
        ],
      },
      {
        heading: `What to expect from the result`,
        paragraphs: [
          `OCR makes mistakes, especially with old typefaces, stained pages, low resolution or skewed text. If the original is well scanned, the result is usually reasonable, but it should be reviewed. A few habits help: scan at around 300 dpi, with the page straight and good contrast.`,
        ],
      },
      {
        heading: `After OCR`,
        paragraphs: [
          `Upload the resulting PDF again. First check that you can now select text. If the recognition is poor, bionic reading will reproduce those errors, because the text that gets transformed is whatever the OCR produced.`,
        ],
      },
      {
        heading: `A note on rights`,
        paragraphs: [
          `Use these tools with documents you have the right to use: your own materials, public domain works or content under a license that allows it.`,
        ],
      },
    ],
    faq: [
      {
        q: `Why doesn't the tool do OCR?`,
        a: `It does not include it for now. Running OCR in the browser would require loading heavy recognition models and still needs human review, so we prefer to say clearly when it is needed rather than promise an unreliable result.`,
      },
      {
        q: `Can I use any OCR tool?`,
        a: `Yes, as long as the result is a PDF with selectable text. Any tool that produces that file works.`,
      },
    ],
    cta: { label: `Try with a PDF` },
  },
  {
    id: 'guide-troubleshoot',
    h1: `Troubleshooting: why my document will not convert`,
    intro: `When a document cannot be converted, the tool shows a message and a code. Here is what each one means, why it happens and what you can do.`,
    updated: UPDATED,
    sections: [
      {
        heading: `The file is not a valid EPUB or PDF (UNSUPPORTED_TYPE)`,
        paragraphs: [
          `The tool identifies the type by its content, not its extension, so renaming a file will not help. Formats such as MOBI, AZW3, DOCX or TXT are not accepted directly. You can convert them to EPUB first with an app such as Calibre, which is free.`,
        ],
      },
      {
        heading: `The file is empty (EMPTY_FILE)`,
        paragraphs: [`The file is 0 bytes, usually because the download was interrupted. Download or copy it again.`],
      },
      {
        heading: `The file exceeds the maximum size (FILE_TOO_LARGE)`,
        paragraphs: [
          `The limit is ${MAX_MB} MB per file, so that conversion is reliable on your device. The message tells you how much yours weighs. For a PDF, an optimizer or your reader's “reduce size” feature is usually enough; for an EPUB, it is the images that weigh the most.`,
        ],
      },
      {
        heading: `The EPUB could not be read (EPUB_INVALID)`,
        paragraphs: [
          `The file is damaged or its structure is non-standard. Download it again and, if the problem persists, open it and save it again with Calibre, which often repairs defective structures. If you want to check it thoroughly, there is a free tool called EPUBCheck.`,
        ],
      },
      {
        heading: `The EPUB is protected (EPUB_PROTECTED)`,
        paragraphs: [`The book has DRM or encrypted content and cannot be transformed. The tool does not remove protections and will not.`],
      },
      {
        heading: `The EPUB has no chapters with text (EPUB_NO_CONTENT)`,
        paragraphs: [
          `This usually happens with comics, illustrated albums or fixed-layout books, whose pages are images. There is no text to transform.`,
        ],
      },
      {
        heading: `The PDF is damaged (PDF_DAMAGED)`,
        paragraphs: [
          `The file is incomplete or corrupt. Download it again; if it came from an email or a cloud service, check that it downloaded in full.`,
        ],
      },
      {
        heading: `The PDF is password-protected (PDF_PROTECTED)`,
        paragraphs: [
          `The tool cannot open encrypted documents. If you know the password, open the PDF in your reader, save it without protection and upload it again.`,
        ],
      },
      {
        heading: `The PDF has no selectable text (PDF_NO_TEXT)`,
        paragraphs: [
          `It is a scan or an image. It needs to go through OCR first. We explain how to check it and what options you have in the guide on scanned PDFs.`,
        ],
      },
      {
        heading: `Too large or complex for this device (RESOURCE_LIMIT)`,
        paragraphs: [
          `The browser ran out of memory. Close other tabs and apps, try a smaller document, or split the original into parts. On phones with little memory this limit is reached sooner.`,
        ],
      },
      {
        heading: `The file could not be created (EXPORT_FAILED or EXPORT_VERIFY_FAILED)`,
        paragraphs: [
          `The conversion ran, but the output file did not pass the integrity check, and that is why it is not downloaded. Try again; if you change a setting, try other values. If the failure repeats with a particular document, you can write to the address in the legal notice, including the code you see on screen.`,
        ],
      },
      {
        heading: `The preview looks odd`,
        paragraphs: [
          `In PDFs, columns, tables or footnotes can come out jumbled, because the file does not store the reading order. In EPUBs, some of the book's styles (backgrounds, columns or positioning) are not shown in the preview, although they are kept in the downloaded file.`,
        ],
      },
    ],
    faq: [
      {
        q: `Does the tool keep my document if it fails?`,
        a: `No. The document is processed in your browser and is not sent to any server, not even when there is an error.`,
      },
    ],
    cta: { label: `Try again` },
  },
];
