interface DownloadPdfTableParams {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  fileName?: string;
}

const LONG_TEXT_LABEL_MATCHER =
  /descripcion|descripci[oó]n|description|[aá]rea verde|nombre|t[ií]tulo|detalle|comentario/i;

const toSpanishOrdinal = (value: number) => `${value}.`;

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

  const tableColumns = ["N°", ...columns];
  const tableRows = rows.map((row, index) => [
    toSpanishOrdinal(index + 1),
    ...row,
  ]);

  const columnStyles: Record<
    number,
    {
      cellWidth?: number | "auto" | "wrap";
      halign?: "left" | "center" | "right";
    }
  > = {
    0: { cellWidth: 40, halign: "center" },
  };

  tableColumns.forEach((column, index) => {
    if (LONG_TEXT_LABEL_MATCHER.test(column)) {
      columnStyles[index] = {
        ...(columnStyles[index] || {}),
        cellWidth: 260,
        halign: "left",
      };
    }
  });

  autoTable(doc, {
    startY: 52,
    head: [tableColumns],
    body: tableRows,
    styles: {
      fontSize: 8,
      cellPadding: 5,
      overflow: "linebreak",
      valign: "top",
      lineWidth: 0.2,
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
    columnStyles,
  });

  doc.save(
    `${fileName ? sanitizeFileName(fileName) : sanitizeFileName(title)}.pdf`,
  );
};
