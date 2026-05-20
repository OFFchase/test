// =====================================================================
// CERTIFICATE GENERATOR CONFIG
// =====================================================================
// Edit values below to position the ФИО text correctly on your template.
// All PDF coordinates are in POINTS (1 inch = 72 points) and measured
// from the BOTTOM-LEFT corner of the page (standard PDF coordinate system).
// =====================================================================

export const config = {
  // ----- PDF TEMPLATE -----
  // Drop your certificate PDF here:  public/template.pdf
  // (the path below is relative to the served site root)
  pdfTemplatePath: '/template.pdf',

  // ----- FONT -----
  // A Cyrillic-capable TTF is required so Russian names render correctly.
  // Roboto-Bold is bundled by default in public/fonts/.
  // Replace with another .ttf if you want a different look.
  fontPath: '/fonts/Roboto-Bold.ttf',

  // ----- TEXT POSITION & STYLE -----
  // Tweak these so the name lands exactly where ВИСИТОВ / ИЗРАИЛ
  // АЛМИРЗАЕВИЧ sits on the template image.
  text: {
    // Horizontal center of the name block (in PDF points from left).
    // For an A4 portrait page (595 pt wide) the center is ~297.
    centerX: 297,

    // Vertical baseline of the FIRST line of the name block
    // (in PDF points from the bottom of the page).
    // The certificate in the sample puts the surname roughly here.
    firstLineBaselineY: 470,

    // Font size in points.
    fontSize: 34,

    // Spacing between lines as a multiple of the font size.
    lineHeight: 1.15,

    // RGB color of the text, each 0..1.
    // Default = dark navy-blue similar to the sample certificate.
    color: { r: 0.07, g: 0.18, b: 0.43 },

    // 'center' | 'left' | 'right'
    align: 'center',

    // If true, the name is forced to UPPERCASE before drawing
    // (the sample certificate uses uppercase).
    uppercase: true,
  },

  // ----- LINE-BREAK BEHAVIOUR -----
  // Default position to break the name: after word #N (1-based).
  // 1 = break after the first word (surname on its own line),
  //     which matches the sample certificate.
  defaultBreakAfterWord: 1,

  // ----- "ФИО ONLY" MODE -----
  // Used when you already have the template printed on paper and only
  // want to overprint the name. Output PDF size, in points.
  // A4 = 595 x 842, Letter = 612 x 792.
  blankPageSize: { width: 595, height: 842 },
};
