/**
 * Official Admissions Unit (وحدة القبول) Report Exporting Engine
 * Supports: PDF (with official kliche background), Word (.docx with RTL), Excel (.xlsx with RTL views), and All-in-One ZIP.
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  PageOrientation,
  Header,
  convertInchesToTwip
} from 'docx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getPortraitKlicheSvg, getLandscapeKlicheSvg, getPortraitKlicheDataUrl, getLandscapeKlicheDataUrl } from './klicheAssets';

export interface ReportMeta {
  title: string;
  subtitle?: string;
  reportNumber: string;
  hijriDate?: string;
  gregorianDate?: string;
  department: string;
  preparer: string;
  approver: string;
  academicYear?: string;
}

export interface ReportTableColumn {
  header: string;
  key: string;
  widthPercent?: number;
}

export interface ReportSummaryItem {
  label: string;
  value: string | number;
}

export interface ReportExportData {
  meta: ReportMeta;
  orientation?: 'auto' | 'portrait' | 'landscape';
  summaryItems?: ReportSummaryItem[];
  columns: ReportTableColumn[];
  rows: Record<string, any>[];
  narrativeText?: string[];
  recommendations?: string[];
}

/**
 * Determine ideal orientation based on content analysis
 */
export function analyzeIdealOrientation(data: ReportExportData): 'portrait' | 'landscape' {
  if (data.orientation && data.orientation !== 'auto') {
    return data.orientation;
  }
  // If table has more than 4 columns or row text is dense, use landscape
  if (data.columns && data.columns.length > 4) {
    return 'landscape';
  }
  return 'portrait';
}

/**
 * 1. Export as High-Definition Print-Ready PDF with Official Kliche
 */
export async function exportReportToPdf(
  data: ReportExportData,
  containerElement?: HTMLElement | null
): Promise<Blob> {
  const orientation = analyzeIdealOrientation(data);
  const isLandscape = orientation === 'landscape';

  // Create temporary container if not provided
  let elementToRender: HTMLElement;
  let isCreatedTemp = false;

  if (containerElement) {
    elementToRender = containerElement;
  } else {
    isCreatedTemp = true;
    elementToRender = document.createElement('div');
    elementToRender.id = 'temp-pdf-export-container';
    elementToRender.style.position = 'fixed';
    elementToRender.style.top = '-99999px';
    elementToRender.style.left = '-99999px';
    elementToRender.style.width = isLandscape ? '1123px' : '794px';
    elementToRender.style.minHeight = isLandscape ? '794px' : '1123px';
    elementToRender.style.backgroundColor = '#ffffff';
    elementToRender.style.color = '#0f172a';
    elementToRender.style.fontFamily = "'Cairo', 'IBM Plex Sans Arabic', sans-serif";
    elementToRender.style.direction = 'rtl';
    elementToRender.style.boxSizing = 'border-box';
    elementToRender.style.padding = '0';
    elementToRender.style.margin = '0';

    // Build the complete HTML page with official kliche header
    const klicheSvg = isLandscape ? getLandscapeKlicheSvg() : getPortraitKlicheSvg();

    elementToRender.innerHTML = `
      <div style="position: relative; width: 100%; min-height: ${isLandscape ? '794px' : '1123px'}; box-sizing: border-box; padding: 25px 35px 35px 35px; background: #ffffff;">
        <!-- Official Kliche Header Top -->
        <div style="width: 100%; margin-bottom: 20px;">
          ${klicheSvg}
        </div>

        <!-- Safe Content Zone: Begins strictly below the line -->
        <div style="width: 100%; font-family: 'Cairo', 'IBM Plex Sans Arabic', sans-serif; direction: rtl; text-align: right;">
          
          <!-- Report Metadata Banner -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 10px;">
            <div>
              <h1 style="font-size: 20px; font-weight: 900; color: #006C70; margin: 0 0 4px 0;">${data.meta.title}</h1>
              ${data.meta.subtitle ? `<p style="font-size: 12px; color: #475569; margin: 0;">${data.meta.subtitle}</p>` : ''}
            </div>
            <div style="text-align: left; font-size: 11px; color: #334155; line-height: 1.6;">
              <div><strong>رقم التقرير:</strong> <span dir="ltr" style="font-weight: bold; color: #006C70;">${data.meta.reportNumber}</span></div>
              <div><strong>التاريخ:</strong> ${data.meta.hijriDate || new Date().toLocaleDateString('ar-SA')}</div>
              <div><strong>الجهة:</strong> ${data.meta.department}</div>
            </div>
          </div>

          <!-- Summary Items Grid (if any) -->
          ${data.summaryItems && data.summaryItems.length > 0 ? `
            <div style="display: grid; grid-template-columns: repeat(${Math.min(data.summaryItems.length, 4)}, 1fr); gap: 10px; margin-bottom: 20px;">
              ${data.summaryItems.map(item => `
                <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; text-align: center;">
                  <div style="font-size: 11px; color: #475569; font-weight: bold; margin-bottom: 4px;">${item.label}</div>
                  <div style="font-size: 16px; font-weight: 900; color: #006C70;">${item.value}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Narrative Text (if any) -->
          ${data.narrativeText && data.narrativeText.length > 0 ? `
            <div style="margin-bottom: 20px; font-size: 12px; line-height: 1.8; color: #1e293b; background: #fdfdfd; padding: 12px; border-right: 3px solid #006C70; border-radius: 4px;">
              ${data.narrativeText.map(para => `<p style="margin: 0 0 8px 0;">${para}</p>`).join('')}
            </div>
          ` : ''}

          <!-- Data Table (True RTL) -->
          ${data.rows && data.rows.length > 0 ? `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px; direction: rtl; text-align: right;">
              <thead>
                <tr style="background-color: #006C70; color: #ffffff;">
                  <th style="border: 1px solid #004d4f; padding: 8px 10px; text-align: center; width: 40px;">م</th>
                  ${data.columns.map(col => `
                    <th style="border: 1px solid #004d4f; padding: 8px 10px; text-align: right; ${col.widthPercent ? `width: ${col.widthPercent}%;` : ''}">${col.header}</th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${data.rows.map((row, idx) => `
                  <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                    <td style="border: 1px solid #e2e8f0; padding: 7px 10px; text-align: center; font-weight: bold; color: #64748b;">${idx + 1}</td>
                    ${data.columns.map(col => `
                      <td style="border: 1px solid #e2e8f0; padding: 7px 10px; text-align: right; color: #1e293b;">${row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '-'}</td>
                    `).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <!-- Recommendations / Notes -->
          ${data.recommendations && data.recommendations.length > 0 ? `
            <div style="margin-bottom: 25px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px;">
              <h4 style="font-size: 13px; font-weight: 900; color: #166534; margin: 0 0 8px 0;">التوصيات والملاحظات الإجرائية:</h4>
              <ul style="margin: 0; padding-right: 20px; font-size: 11.5px; color: #14532d; line-height: 1.7;">
                ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Official Signatures Block -->
          <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 11px;">
            <div style="border: 1px solid #006C70; background: #f8fafc; padding: 12px; border-radius: 8px; text-align: center;">
              <div style="font-weight: bold; color: #006C70; margin-bottom: 4px;">مُعدّ التقرير:</div>
              <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 2px;">${data.meta.preparer}</div>
              <div style="font-size: 10px; color: #64748b;">${data.meta.department}</div>
            </div>
            <div style="border: 1px solid #006C70; background: #f0fdf4; padding: 12px; border-radius: 8px; text-align: center;">
              <div style="font-weight: bold; color: #006C70; margin-bottom: 4px;">اعتماد صاحب الصلاحية:</div>
              <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 2px;">${data.meta.approver}</div>
              <div style="font-size: 10px; color: #059669; font-weight: bold;">معتمد إلكترونياً ورسمياً ✓</div>
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(elementToRender);
  }

  // Render with html2canvas and jsPDF
  try {
    const canvas = await html2canvas(elementToRender, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = isLandscape ? 297 : 210;
    const pdfHeight = isLandscape ? 210 : 297;

    const imgProps = pdf.getImageProperties(imgData);
    const renderHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = renderHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, renderHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - renderHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, renderHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    const pdfBlob = pdf.output('blob');
    return pdfBlob;
  } finally {
    if (isCreatedTemp && elementToRender.parentNode) {
      elementToRender.parentNode.removeChild(elementToRender);
    }
  }
}

/**
 * 2. Export as Official Editable Word Document (.docx) with RTL properties
 */
export async function exportReportToWord(data: ReportExportData): Promise<Blob> {
  const orientation = analyzeIdealOrientation(data);
  const isLandscape = orientation === 'landscape';

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
              width: isLandscape ? convertInchesToTwip(11.69) : convertInchesToTwip(8.27),
              height: isLandscape ? convertInchesToTwip(8.27) : convertInchesToTwip(11.69)
            },
            margin: {
              top: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8)
            }
          }
        },
        children: [
          // Header Line: Kingdom & Ministry in Arabic RTL
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            children: [
              new TextRun({
                text: 'المملكة العربية السعودية\nوَزَارَةُ التَّعْلِيمِ (288)\nإدارة التعليم بمنطقة المدينة المنورة - الشؤون التعليمية - وحدة القبول',
                bold: true,
                size: 22,
                font: 'Cairo'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            children: [
              new TextRun({
                text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                bold: true,
                size: 24,
                font: 'Cairo'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: '_________________________________________________________________________________',
                color: '006C70'
              })
            ]
          }),

          // Report Title
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: data.meta.title,
                bold: true,
                size: 32,
                color: '006C70',
                font: 'Cairo'
              })
            ]
          }),

          // Metadata Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        bidirectional: true,
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: 'رقم التقرير: ', bold: true, font: 'Cairo' }),
                          new TextRun({ text: data.meta.reportNumber, font: 'Cairo' })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        bidirectional: true,
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: 'تاريخ التقرير: ', bold: true, font: 'Cairo' }),
                          new TextRun({ text: data.meta.hijriDate || new Date().toLocaleDateString('ar-SA'), font: 'Cairo' })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        bidirectional: true,
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: 'الجهة المصدرة: ', bold: true, font: 'Cairo' }),
                          new TextRun({ text: data.meta.department, font: 'Cairo' })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          new Paragraph({ spacing: { after: 200 }, children: [] }),

          // Narrative Text
          ...(data.narrativeText || []).map(
            para =>
              new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.RIGHT,
                spacing: { after: 150 },
                children: [
                  new TextRun({
                    text: para,
                    size: 22,
                    font: 'Cairo'
                  })
                ]
              })
          ),

          // Main Data Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Header Row
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: '006C70' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        bidirectional: true,
                        children: [new TextRun({ text: 'م', bold: true, color: 'FFFFFF', font: 'Cairo' })]
                      })
                    ]
                  }),
                  ...data.columns.map(
                    col =>
                      new TableCell({
                        shading: { fill: '006C70' },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            bidirectional: true,
                            children: [new TextRun({ text: col.header, bold: true, color: 'FFFFFF', font: 'Cairo' })]
                          })
                        ]
                      })
                  )
                ]
              }),
              // Data Rows
              ...data.rows.map(
                (row, idx) =>
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            bidirectional: true,
                            children: [new TextRun({ text: String(idx + 1), font: 'Cairo' })]
                          })
                        ]
                      }),
                      ...data.columns.map(
                        col =>
                          new TableCell({
                            children: [
                              new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                bidirectional: true,
                                children: [
                                  new TextRun({
                                    text: row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '-',
                                    font: 'Cairo'
                                  })
                                ]
                              })
                            ]
                          })
                      )
                    ]
                  })
              )
            ]
          }),

          new Paragraph({ spacing: { after: 300 }, children: [] }),

          // Signatures Section
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        bidirectional: true,
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: 'مُعدّ التقرير:\n', bold: true, color: '006C70', font: 'Cairo' }),
                          new TextRun({ text: `${data.meta.preparer}\n`, bold: true, font: 'Cairo' }),
                          new TextRun({ text: data.meta.department, size: 18, color: '64748b', font: 'Cairo' })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        bidirectional: true,
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: 'اعتماد صاحب الصلاحية:\n', bold: true, color: '006C70', font: 'Cairo' }),
                          new TextRun({ text: `${data.meta.approver}\n`, bold: true, font: 'Cairo' }),
                          new TextRun({ text: 'معتمد إلكترونياً ورسمياً من المنظومة ✓', size: 18, color: '059669', font: 'Cairo' })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }
    ]
  });

  return await Packer.toBlob(doc);
}

/**
 * 3. Export as Structured Excel Workbook (.xlsx) with True RTL sheets
 */
export function exportReportToExcel(data: ReportExportData): Blob {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary Sheet («ملخص التقرير»)
  const summaryData: any[][] = [
    ['المملكة العربية السعودية - وزارة التعليم'],
    ['الإدارة العامة للتعليم بمنطقة المدينة المنورة - الشؤون التعليمية - وحدة القبول'],
    [''],
    ['عنوان التقرير:', data.meta.title],
    ['رقم التقرير الإسنادي:', data.meta.reportNumber],
    ['تاريخ الاستخراج:', data.meta.hijriDate || new Date().toLocaleDateString('ar-SA')],
    ['الجهة المصدرة:', data.meta.department],
    ['مُعدّ التقرير:', data.meta.preparer],
    ['صاحب الصلاحية المعتمد:', data.meta.approver],
    ['حالة الاعتماد:', 'معتمد إلكترونياً ورسمياً بنجاح ✓'],
    ['']
  ];

  if (data.summaryItems && data.summaryItems.length > 0) {
    summaryData.push(['المؤشرات والمقاييس الرئيسة:']);
    data.summaryItems.forEach(item => {
      summaryData.push([item.label, item.value]);
    });
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  (wsSummary as any)['!views'] = [{ RTL: true }];
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'ملخص التقرير');

  // Sheet 2: Detailed Data Sheet («سجلات البيانات التفصيلية»)
  const tableData: any[][] = [];
  // Header row
  const headers = ['م', ...data.columns.map(c => c.header)];
  tableData.push(headers);

  // Data rows
  data.rows.forEach((row, idx) => {
    const rowValues = [
      idx + 1,
      ...data.columns.map(c => (row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]) : ''))
    ];
    tableData.push(rowValues);
  });

  const wsData = XLSX.utils.aoa_to_sheet(tableData);
  (wsData as any)['!views'] = [{ RTL: true }];
  wsData['!cols'] = [{ wch: 6 }, ...data.columns.map(() => ({ wch: 24 }))];
  XLSX.utils.book_append_sheet(wb, wsData, 'البيانات التفصيلية');

  // Generate Excel buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * 4. Export All Formats Bundled in a clean ZIP file
 */
export async function exportReportAllFormats(data: ReportExportData): Promise<Blob> {
  const zip = new JSZip();
  const baseName = `تقرير_وحدة_القبول_${data.meta.reportNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  // 1. Generate PDF
  const pdfBlob = await exportReportToPdf(data);
  zip.file(`${baseName}.pdf`, pdfBlob);

  // 2. Generate Word
  const wordBlob = await exportReportToWord(data);
  zip.file(`${baseName}.docx`, wordBlob);

  // 3. Generate Excel
  const excelBlob = exportReportToExcel(data);
  zip.file(`${baseName}.xlsx`, excelBlob);

  // Generate Zip Blob
  return await zip.generateAsync({ type: 'blob' });
}
