interface DownloadPdfTableParams {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  fileName?: string;
}

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "reporte";

export const downloadPdfTable = async ({
  title,
  columns,
  rows,
  fileName,
}: DownloadPdfTableParams) => {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  doc.setFontSize(14);
  doc.text(title, 40, 38);

  autoTable(doc, {
    startY: 52,
    head: [columns],
    body: rows,
    styles: {
      fontSize: 8,
      cellPadding: 5,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [63, 173, 147],
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [243, 251, 249],
    },
    margin: {
      left: 28,
      right: 28,
    },
  });

  doc.save(`${fileName ? sanitizeFileName(fileName) : sanitizeFileName(title)}.pdf`);
};