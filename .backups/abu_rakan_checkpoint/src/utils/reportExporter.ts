/**
 * Official Admissions Unit (وحدة القبول) Report Exporting Engine
 * Supports: PDF (with official kliche background), Word (.docx with RTL), Excel (.xlsx with RTL views), and All-in-One ZIP.
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ExcelJS from 'exceljs';
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
  VerticalAlign,
  HeadingLevel,
  BorderStyle,
  PageOrientation,
  Header,
  ImageRun,
  convertInchesToTwip
} from 'docx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getPortraitKlicheSvg, getLandscapeKlicheSvg, getPortraitKlicheDataUrl, getLandscapeKlicheDataUrl, MOE_LOGO_SVG, getMoeLogoDataUrl } from './klicheAssets';

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
  icon?: string;
}

export interface ReportGovernorateSection {
  id: string;
  name: string;
  summaryItems: ReportSummaryItem[];
}

export interface ReportExportData {
  meta: ReportMeta;
  orientation?: 'auto' | 'portrait' | 'landscape';
  summaryItems?: ReportSummaryItem[];
  sections?: ReportGovernorateSection[];
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
 * Optimized for speed, non-blocking execution, zero browser hang, and true multi-page slicing.
 */
export async function exportReportToPdf(
  data: ReportExportData,
  containerElement?: HTMLElement | null,
  onProgress?: (msg: string) => void
): Promise<Blob> {
  const orientation = analyzeIdealOrientation(data);
  const isLandscape = orientation === 'landscape';

  onProgress?.('جارٍ تجهيز مستند التقرير والكليشة الرسمية...');
  await new Promise(r => setTimeout(r, 20));

  // Create an isolated hidden iframe to isolate styles and prevent html2canvas from scanning global Tailwind stylesheets
  const iframe = document.createElement('iframe');
  iframe.id = 'pdf-render-isolated-iframe';
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.left = '-9999px';
  iframe.style.width = isLandscape ? '1123px' : '794px';
  iframe.style.height = '1200px';
  iframe.style.border = 'none';
  iframe.style.opacity = '1';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';

  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error('Cannot access iframe document');

    const rowsToRender = data.rows && data.rows.length > 150 ? data.rows.slice(0, 150) : (data.rows || []);
    const hasMoreRows = data.rows && data.rows.length > 150;

    // The Official Professional Header (Simplified for Printing Stability)
    const officialHeader = `
      <div style="width: 100%; border-bottom: 2px solid #006C70; margin-bottom: 20px; padding: 25px 45px 15px 45px; direction: rtl; font-family: 'Cairo', sans-serif;">
        <div style="display: block; width: 100%;">
          <!-- Right: Hierarchy -->
          <div style="float: right; width: 35%; text-align: center; color: #1e293b; line-height: 1.5;">
            <div style="font-weight: 800; font-size: 13px; margin-bottom: 2px;">المملكة العربية السعودية</div>
            <div style="font-weight: 800; font-size: 13px; margin-bottom: 2px;">وزارة التعليم</div>
            <div style="font-weight: 700; font-size: 11px; margin-bottom: 2px;">الادارة العامة للتعليم بمنطقة المدينة المنورة</div>
            <div style="font-weight: 700; font-size: 11px; margin-bottom: 2px;">الشؤون التعليمية</div>
            <div style="font-weight: 800; font-size: 12px; color: #006C70; margin-top: 4px;">وحدة القبول</div>
          </div>

          <!-- Center: Official Logo (Fixed Image) -->
          <div style="float: right; width: 30%; text-align: center;">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/7/76/Ministry_of_Education_%28Saudi_Arabia%29_%28logo%29.png"
              alt="Ministry of Education Logo"
              referrerPolicy="no-referrer"
              style="height: 52px; width: auto; object-fit: contain; filter: brightness(1.1); margin: 0 auto; display: block;"
            />
          </div>

          <!-- Left: Metadata -->
          <div style="float: left; width: 35%; text-align: left; color: #1e293b; line-height: 2.2; font-weight: 700; font-size: 13px;">
            <div style="margin-bottom: 4px;">الرقـم: ....................</div>
            <div style="margin-bottom: 4px;">التاريخ: .... / .... / 1446هـ</div>
            <div>المرفقات: ....................</div>
          </div>
          <div style="clear: both;"></div>
        </div>
      </div>
    `;

    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        margin: 0;
        padding: 0;
        font-family: 'Cairo', sans-serif;
        color: #334155;
        background: #f8fafc;
        direction: rtl;
        text-align: right;
        width: ${isLandscape ? '1123px' : '794px'};
      }
      .page-section { 
        padding: 60px 80px; /* Wide margins for professional look */
        background: #fff; 
        position: relative;
        min-height: 1100px;
        overflow: hidden;
        margin: 0 auto;
      }
      
      /* Sophisticated Header */
      .premium-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 20px;
        margin-bottom: 40px;
        border-bottom: 1px solid #f1f5f9;
      }
      .logo-box { width: 85px; } /* Smaller logo */
      .header-meta { text-align: left; font-size: 10px; color: #94a3b8; line-height: 1.5; }
      
      /* Balanced Typography */
      .main-display-title {
        font-size: 22px; /* Reduced for elegance */
        font-weight: 800;
        color: #0f172a;
        text-align: center;
        margin: 30px auto;
        position: relative;
        padding-bottom: 15px;
      }
      .main-display-title::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 30px;
        height: 3px;
        background: #006C70;
        border-radius: 2px;
      }

      /* Compact Elegant Cards & Governorate Banner matching image.png */
      .gov-card-container {
        border: 1px solid #cbd5e1;
        border-radius: 16px;
        overflow: hidden;
        margin: 25px 0;
        background: #ffffff;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
      }
      .gov-card-banner {
        background: #006C70;
        padding: 12px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #ffffff;
      }
      .gov-card-title {
        font-size: 16px;
        font-weight: 800;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .gov-card-badge {
        background: rgba(255, 255, 255, 0.18);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: #ffffff;
        padding: 4px 14px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 800;
      }
      .gov-card-body {
        padding: 18px;
        background: #fafafa;
      }
      .stats-grid-refined {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: flex-start;
      }
      .stat-card-elegant {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px 14px;
        width: calc(25% - 10px);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 80px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      }
      .stat-card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .stat-label-refined { font-size: 10px; color: #475569; font-weight: 700; line-height: 1.3; }
      .stat-value-refined { font-size: 18px; font-weight: 800; color: #006C70; text-align: center; }

      /* Professional Minimalist Tables */
      .premium-table-wrapper {
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #f1f5f9;
        margin-top: 30px;
        background: #fff;
      }
      .premium-table {
        width: 100%;
        border-collapse: collapse;
      }
      .premium-table th {
        background: #f8fafc;
        color: #64748b;
        font-weight: 700;
        font-size: 11px;
        padding: 14px;
        text-align: center;
        border-bottom: 1px solid #f1f5f9;
      }
      .premium-table td {
        padding: 12px;
        text-align: center;
        font-size: 11px;
        border-bottom: 1px solid #f8fafc;
        color: #334155;
      }
      .premium-table tr:nth-child(even) { background: #fafafa; }
      
      /* Subtle Footer */
      .premium-footer {
        position: absolute;
        bottom: 40px;
        left: 80px;
        right: 80px;
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #cbd5e1;
        border-top: 1px solid #f1f5f9;
        padding-top: 15px;
      }
      .no-split { break-inside: avoid !important; page-break-inside: avoid !important; }
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <style>${styles}</style>
      </head>
      <body>
        <div id="pdf-content-area">
      <!-- PAGE 1: EXECUTIVE SUMMARY -->
      ${(data.summaryItems || []).length > 0 ? `
        <div class="page-section">
          <div class="premium-header">
            <!-- Right: Hierarchy -->
            <div style="width: 35%; text-align: center; color: #1e293b; line-height: 1.5; font-size: 10px;">
              <div style="font-weight: 800; font-size: 11px;">المملكة العربية السعودية</div>
              <div style="font-weight: 800; font-size: 11px;">وزارة التعليم</div>
              <div style="font-weight: 700; font-size: 9.5px;">الادارة العامة للتعليم بمنطقة المدينة المنورة</div>
              <div style="font-weight: 700; font-size: 9.5px;">الشؤون التعليمية</div>
              <div style="font-weight: 800; font-size: 11px; color: #006C70; margin-top: 2px;">وحدة القبول</div>
            </div>

            <!-- Center: Logo -->
            <div class="logo-box" style="width: 30%; text-align: center;">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/76/Ministry_of_Education_%28Saudi_Arabia%29_%28logo%29.png"
                alt="Ministry of Education Logo"
                referrerPolicy="no-referrer"
                style="height: 52px; width: auto; object-fit: contain; filter: brightness(1.1); margin: 0 auto; display: block;"
              />
            </div>

            <!-- Left: Metadata -->
            <div class="header-meta" style="width: 35%; text-align: left;">
              <div>${data.meta.hijriDate || new Date().toLocaleDateString('ar-SA')}</div>
              <div>رقم التقرير: ${data.meta.reportNumber}</div>
              <div>الجهة المعنية: ${data.meta.department || 'وحدة القبول'}</div>
            </div>
          </div>
          
          <h1 class="main-display-title">المؤشرات الإجمالية العامة المعتمدة</h1>
          
          <div class="stats-grid-refined">
            ${data.summaryItems?.map(item => `
              <div class="stat-card-elegant">
                <span class="stat-label-refined">${item.label || ''}</span>
                <span class="stat-value-refined">${item.value !== undefined ? item.value : ''}</span>
              </div>
            `).join('')}
          </div>
          
          <div style="margin-top: 80px; padding: 25px; border: 1px solid #f1f5f9; border-radius: 12px; color: #64748b; font-size: 12px; line-height: 1.8; text-align: justify; background: #fff;">
             <strong style="color: #006C70;">ملخص تحليلي:</strong> توضح البيانات الإحصائية أعلاه نظرة شمولية للأداء التشغيلي التعليمي على مستوى المنطقة، حيث تم اعتماد هذه القيم بناءً على المسوحات الميدانية والبيانات الرقمية المحدثة في منصة ذكاء الأعمال.
          </div>

          <div class="premium-footer">
            <div>منصة ذكاء الأعمال الموحدة</div>
            <div>الصفحة 1 من ${data.sections?.length ? data.sections.length + 2 : 2}</div>
          </div>
        </div>
      ` : ''}

      <!-- GOVERNORATE PAGES -->
      ${(data.sections || []).length > 0 ? (
        data.sections.map((section, idx) => `
          <div class="page-section">
            <div class="premium-header">
              <!-- Right: Hierarchy -->
              <div style="width: 35%; text-align: center; color: #1e293b; line-height: 1.5; font-size: 10px;">
                <div style="font-weight: 800; font-size: 11px;">المملكة العربية السعودية</div>
                <div style="font-weight: 800; font-size: 11px;">وزارة التعليم</div>
                <div style="font-weight: 700; font-size: 9.5px;">الادارة العامة للتعليم بمنطقة المدينة المنورة</div>
                <div style="font-weight: 700; font-size: 9.5px;">الشؤون التعليمية</div>
                <div style="font-weight: 800; font-size: 11px; color: #006C70; margin-top: 2px;">وحدة القبول</div>
              </div>

              <!-- Center: Logo -->
              <div class="logo-box" style="width: 30%; text-align: center;">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/76/Ministry_of_Education_%28Saudi_Arabia%29_%28logo%29.png"
                  alt="Ministry of Education Logo"
                  referrerPolicy="no-referrer"
                  style="height: 52px; width: auto; object-fit: contain; filter: brightness(1.1); margin: 0 auto; display: block;"
                />
              </div>

              <!-- Left: Metadata -->
              <div class="header-meta" style="width: 35%; text-align: left;">
                <div>الجهة: ${data.meta.department}</div>
                <div>القسم الفرعي: ${section.name}</div>
                <div>التاريخ: ${data.meta.hijriDate || new Date().toLocaleDateString('ar-SA')}</div>
              </div>
            </div>
            
            <div class="gov-card-container">
              <div class="gov-card-banner">
                <div class="gov-card-title">
                  <span>📍</span>
                  <span>${section.name.includes('محافظة') || section.name.includes('المدينة') ? section.name : `محافظة ${section.name}`}</span>
                </div>
                <div class="gov-card-badge">
                  13 مؤشر إحصائي معتمد
                </div>
              </div>
              <div class="gov-card-body">
                <div class="stats-grid-refined">
                  ${(section.summaryItems || []).map(item => `
                    <div class="stat-card-elegant">
                      <div class="stat-card-top">
                        <span class="stat-label-refined">${item.label || ''}</span>
                      </div>
                      <div class="stat-value-refined">${item.value !== undefined ? item.value : ''}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <div class="premium-footer">
              <div>وزارة التعليم - التخطيط والمعلومات</div>
              <div>الصفحة ${idx + 2}</div>
            </div>
          </div>
        `).join('')
      ) : ''}

      <!-- DATA RECORDS -->
      ${rowsToRender.length > 0 ? (
        Array.from({ length: Math.ceil(rowsToRender.length / 22) }, (_, i) => rowsToRender.slice(i * 22, i * 22 + 22)).map((rowChunk, chunkIdx) => `
          <div class="page-section">
            <div class="premium-header">
              <!-- Right: Hierarchy -->
              <div style="width: 35%; text-align: center; color: #1e293b; line-height: 1.5; font-size: 10px;">
                <div style="font-weight: 800; font-size: 11px;">المملكة العربية السعودية</div>
                <div style="font-weight: 800; font-size: 11px;">وزارة التعليم</div>
                <div style="font-weight: 700; font-size: 9.5px;">الادارة العامة للتعليم بمنطقة المدينة المنورة</div>
                <div style="font-weight: 700; font-size: 9.5px;">الشؤون التعليمية</div>
                <div style="font-weight: 800; font-size: 11px; color: #006C70; margin-top: 2px;">وحدة القبول</div>
              </div>

              <!-- Center: Logo -->
              <div class="logo-box" style="width: 30%; text-align: center;">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/76/Ministry_of_Education_%28Saudi_Arabia%29_%28logo%29.png"
                  alt="Ministry of Education Logo"
                  referrerPolicy="no-referrer"
                  style="height: 52px; width: auto; object-fit: contain; filter: brightness(1.1); margin: 0 auto; display: block;"
                />
              </div>

              <!-- Left: Metadata -->
              <div class="header-meta" style="width: 35%; text-align: left;">
                <div>التقرير: سجل البيانات التفصيلي</div>
                <div>رقم التقرير: ${data.meta.reportNumber}</div>
                <div>التاريخ: ${data.meta.hijriDate || new Date().toLocaleDateString('ar-SA')}</div>
              </div>
            </div>
            
            <h1 class="main-display-title" style="font-size: 18px;">سجل البيانات التفصيلي ${chunkIdx > 0 ? `(تابع - ${chunkIdx + 1})` : ''}</h1>
            
            <div class="premium-table-wrapper">
              <table class="premium-table">
                <thead>
                  <tr>
                    <th style="width: 45px;">م</th>
                    ${data.columns.map(col => `<th>${col.header}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${rowChunk.map((row, idx) => `
                    <tr>
                      <td style="font-weight: bold; color: #94a3b8; background: #fafafa;">${(chunkIdx * 22) + idx + 1}</td>
                      ${data.columns.map(col => `<td>${row[col.key] !== undefined ? row[col.key] : '-'}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="premium-footer">
              <div>وزارة التعليم</div>
              <div>نهاية سجل البيانات</div>
            </div>
          </div>
        `).join('')
      ) : ''}

      <!-- FINAL PAGE: AUTHENTICATION -->
      <div class="page-section">
        <div class="premium-header">
          <!-- Right: Hierarchy -->
          <div style="width: 35%; text-align: center; color: #1e293b; line-height: 1.5; font-size: 10px;">
            <div style="font-weight: 800; font-size: 11px;">المملكة العربية السعودية</div>
            <div style="font-weight: 800; font-size: 11px;">وزارة التعليم</div>
            <div style="font-weight: 700; font-size: 9.5px;">الادارة العامة للتعليم بمنطقة المدينة المنورة</div>
            <div style="font-weight: 700; font-size: 9.5px;">الشؤون التعليمية</div>
            <div style="font-weight: 800; font-size: 11px; color: #006C70; margin-top: 2px;">وحدة القبول</div>
          </div>

          <!-- Center: Logo -->
          <div class="logo-box" style="width: 30%; text-align: center;">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/7/76/Ministry_of_Education_%28Saudi_Arabia%29_%28logo%29.png"
              alt="Ministry of Education Logo"
              referrerPolicy="no-referrer"
              style="height: 52px; width: auto; object-fit: contain; filter: brightness(1.1); margin: 0 auto; display: block;"
            />
          </div>

          <!-- Left: Metadata -->
          <div class="header-meta" style="width: 35%; text-align: left;">
            <div>الوثيقة: الاعتماد والختم الرسمي</div>
            <div>رقم التقرير: ${data.meta.reportNumber}</div>
            <div>تاريخ الاعتماد: ${data.meta.hijriDate || new Date().toLocaleDateString('ar-SA')}</div>
          </div>
        </div>

        <h1 class="main-display-title">الاعتماد والمصادقة الرسمية</h1>

        <div style="display: flex; gap: 30px; margin-top: 100px; justify-content: center;">
          <div style="flex: 1; max-width: 280px; border: 1px solid #f1f5f9; padding: 25px; border-radius: 12px; text-align: center; background: #fafafa;">
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 12px;">مُعدّ التقرير</div>
            <div style="font-size: 16px; font-weight: 800; color: #1e293b;">${data.meta.preparer || '---'}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${data.meta.department || ''}</div>
          </div>

          <div style="flex: 1; max-width: 280px; border: 1px solid #f1f5f9; padding: 25px; border-radius: 12px; text-align: center; background: #fafafa;">
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 12px;">صاحب الصلاحية</div>
            <div style="font-size: 16px; font-weight: 800; color: #006C70;">${data.meta.approver || '---'}</div>
            <div style="font-size: 10px; color: #059669; font-weight: bold; margin-top: 4px;">تم الاعتماد إلكترونياً ✓</div>
          </div>
        </div>

        <div style="margin-top: 150px; text-align: center;">
          <div style="display: inline-block; padding: 15px 30px; border: 1px dashed #e2e8f0; border-radius: 8px; color: #94a3b8; font-size: 11px;">
            هذه الوثيقة صادرة عن النظام الآلي لذكاء الأعمال بوزارة التعليم وتعتبر معتمدة رسمياً.
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
    `;

    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    onProgress?.('جارٍ تحضير الصفحات الاستراتيجية...');
    // Small delay to ensure styles and images are ready in the iframe
    await new Promise(r => setTimeout(r, 400));

    // Capture each .page-section individually
    const sections = iframeDoc.querySelectorAll('.page-section');
    if (sections.length === 0) throw new Error('لم يتم العثور على محتوى للتقرير');

    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = isLandscape ? 297 : 210;
    const pdfHeight = isLandscape ? 210 : 297;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i] as HTMLElement;
      if (i > 0) pdf.addPage();
      
      onProgress?.(`معالجة الصفحة ${i + 1} من ${sections.length}...`);
      
      const contentCanvas = await html2canvas(section, {
        scale: 1.5, // High quality enough for documents
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: isLandscape ? 1123 : 794,
        height: 1100 // Match our min-height in styles
      });

      const imgData = contentCanvas.toDataURL('image/jpeg', 0.85);
      
      // Since our HTML pages are designed to fit A4, we just map the canvas to the full PDF page
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    onProgress?.('تم إنشاء الوثيقة بنجاح ✓');
    return pdf.output('blob');
  } finally {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
}

/**
 * Direct Vector Print to PDF using native browser engine (Instant, 100% Vector, Zero Delay)
 */
export function printReportDirectly(data: ReportExportData): void {
  const orientation = analyzeIdealOrientation(data);
  const isLandscape = orientation === 'landscape';
  const rowsToRender = (data.rows || []).slice(0, 150);
  const logoDataUrl = getMoeLogoDataUrl();

  // Consistent Professional Official Header with SVG Data URL logo
  const officialHeader = `
    <div style="width: 100%; border-bottom: 2px solid #006C70; margin-bottom: 20px; padding: 25px 45px 15px 45px; direction: rtl; font-family: 'Cairo', sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <!-- Right: Hierarchy -->
        <div style="width: 35%; text-align: center; color: #1e293b; line-height: 1.5;">
          <div style="font-weight: 800; font-size: 13px; margin-bottom: 2px;">المملكة العربية السعودية</div>
          <div style="font-weight: 800; font-size: 13px; margin-bottom: 2px;">وزارة التعليم</div>
          <div style="font-weight: 700; font-size: 11px; margin-bottom: 2px;">الإدارة العامة للتعليم بمنطقة المدينة المنورة</div>
          <div style="font-weight: 700; font-size: 11px; margin-bottom: 2px;">الشؤون التعليمية</div>
          <div style="font-weight: 800; font-size: 12px; color: #006C70; margin-top: 4px;">وحدة القبول</div>
        </div>

        <!-- Center: Official Logo (Exact Header Image) -->
        <div style="width: 30%; text-align: center;">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/7/76/Ministry_of_Education_%28Saudi_Arabia%29_%28logo%29.png"
            alt="Ministry of Education Logo"
            referrerPolicy="no-referrer"
            style="height: 58px; width: auto; object-fit: contain; margin: 0 auto; display: block;"
          />
        </div>

        <!-- Left: Metadata -->
        <div style="width: 35%; text-align: left; color: #1e293b; line-height: 2.2; font-weight: 700; font-size: 13px;">
          <div style="margin-bottom: 4px;">الرقـم: <strong style="color: #006C70;">${data.meta.reportNumber || '...........'}</strong></div>
          <div style="margin-bottom: 4px;">التاريخ: <strong>${data.meta.hijriDate || new Date().toLocaleDateString('ar-SA')}</strong></div>
          <div>المرفقات: <strong>....................</strong></div>
        </div>
      </div>
    </div>
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>${data.meta.title} - ${data.meta.reportNumber}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page {
          size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
          margin: 10mm;
        }
        @media print {
          .no-print { display: none !important; }
          body { background: #ffffff !important; padding: 0 !important; }
          .report-wrapper { padding: 0 !important; box-shadow: none !important; border: none !important; }
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 20px;
          font-family: 'Cairo', system-ui, -apple-system, sans-serif;
          color: #0f172a;
          background: #f1f5f9;
          direction: rtl;
          text-align: right;
        }
        .control-banner {
          background: #006C70;
          color: #ffffff;
          padding: 14px 24px;
          border-radius: 16px;
          margin: 0 auto 24px auto;
          max-width: ${isLandscape ? '1120px' : '820px'};
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 10px 25px -5px rgba(0, 108, 112, 0.3);
        }
        .btn-action {
          background: #ffffff;
          color: #006C70;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .btn-action:hover {
          background: #e0f2f1;
          transform: translateY(-1px);
        }
        .btn-close {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }
        .btn-close:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        .report-wrapper {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          padding: 35px 45px;
          margin: 0 auto;
          max-width: ${isLandscape ? '1120px' : '820px'};
        }

        .page-section {
          margin-bottom: 30px;
          display: block;
          width: 100%;
        }

        .no-split {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        .meta-table {
          width: 100%;
          border-bottom: 3px solid #006C70;
          padding-bottom: 15px;
          margin-bottom: 30px;
        }
        .gov-card {
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          overflow: hidden;
          background: #ffffff;
          margin-bottom: 20px;
        }
        .gov-header {
          background: #006C70;
          color: #ffffff;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 800;
        }
        .stat-grid {
          display: flex;
          flex-wrap: wrap;
          padding: 12px;
          gap: 8px;
        }
        .stat-box {
          flex: 1 1 22%;
          min-width: 120px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        th {
          background-color: #006C70 !important;
          color: #ffffff !important;
          border: 1px solid #004d4f;
          padding: 10px 12px;
          text-align: center;
          font-size: 12px;
          font-weight: 800;
        }
        td {
          border: 1px solid #cbd5e1;
          padding: 8px 12px;
          text-align: center;
          font-size: 11.5px;
        }
        .no-border td { border: none !important; }
      </style>
    </head>
    <body>
      <div class="control-banner no-print">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">🖨️</span>
          <div>
            <div style="font-size: 15px; font-weight: 900;">التقرير الرسمي - وحدة القبول والتوجيه</div>
            <div style="font-size: 11px; opacity: 0.9;">جاهز للطباعة المباشرة أو الحفظ كـ ملف PDF فائق الجودة</div>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button class="btn-action" onclick="window.print()">
            <span>🖨️ اضغط للطباعة / الحفظ كـ PDF</span>
          </button>
          <button class="btn-close" onclick="window.close()">
            ✖ إغلاق
          </button>
        </div>
      </div>

      <div class="report-wrapper">
        ${officialHeader}

        <table class="meta-table no-border">
          <tr>
            <td style="width: 65%; text-align: right;">
              <div style="font-size: 22px; font-weight: 900; color: #006C70; margin-bottom: 4px;">${data.meta.title}</div>
              ${data.meta.subtitle ? `<div style="font-size: 13.5px; color: #475569; font-weight: 700;">${data.meta.subtitle}</div>` : ''}
            </td>
            <td style="width: 35%; font-size: 11.5px; color: #334155; line-height: 1.8; text-align: left;">
              <div><span>رقم التقرير:</span> <strong style="color: #006C70;">${data.meta.reportNumber}</strong></div>
              <div><span>تاريخ الإصدار:</span> <strong>${data.meta.hijriDate || new Date().toLocaleDateString('ar-SA')}</strong></div>
              <div><span>الجهة المعنية:</span> <strong>${data.meta.department}</strong></div>
            </td>
          </tr>
        </table>
        
        <div id="pdf-content-area">
          ${(data.summaryItems || []).length > 0 ? `
            <div class="page-section no-split">
              <div style="font-size: 14px; font-weight: 900; color: #006C70; margin-bottom: 12px; border-right: 4px solid #006C70; padding-right: 8px;">
                المؤشرات الإجمالية العامة المعتمدة:
              </div>
              <div class="stat-grid" style="padding: 0;">
                ${data.summaryItems?.map(item => `
                  <div class="stat-box" style="flex: 1 1 18%;">
                    <div style="font-size: 10px; color: #64748b; font-weight: 700; margin-bottom: 4px;">${item.label || ''}</div>
                    <div style="font-size: 16px; font-weight: 900; color: #006C70;">${item.value !== undefined ? item.value : ''}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${(data.sections || []).length > 0 ? `
            <div class="page-section">
              <div style="margin-bottom: 15px; font-size: 14px; font-weight: 900; color: #0f172a; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0;">
                توزيع المؤشرات الإحصائية العامة المعتمدة حسب المحافظات والقطاعات:
              </div>
              ${data.sections?.map(section => `
                <div class="gov-card no-split">
                  <div class="gov-header">📍 ${section.name || ''}</div>
                  <div class="stat-grid">
                    ${(section.summaryItems || []).map(item => `
                      <div class="stat-box">
                        <div style="font-size: 10px; color: #475569; font-weight: 700; margin-bottom: 3px;">${item.label || ''}</div>
                        <div style="font-size: 13.5px; font-weight: 900; color: #006C70;">${item.value !== undefined ? item.value : ''}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${(data.narrativeText || []).length > 0 ? `
            <div class="page-section no-split" style="font-size: 12px; line-height: 1.8; color: #1e293b; background: #f8fafc; padding: 18px; border-radius: 10px; border-right: 5px solid #006C70; margin-bottom: 25px;">
              <div style="font-weight: 900; color: #006C70; margin-bottom: 8px; font-size: 14px;">التوصيات والملاحظات الإجرائية:</div>
              <ul style="margin-right: 20px; padding: 0;">
                ${data.narrativeText?.map(t => `<li style="margin-bottom: 6px;">${t}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${rowsToRender.length > 0 ? `
            <div class="page-section">
              <div style="font-size: 14px; font-weight: 900; color: #006C70; margin-bottom: 12px; border-right: 4px solid #006C70; padding-right: 8px;">
                سجل البيانات التفصيلي:
              </div>
              <table class="main-table">
                <thead>
                  <tr>
                    <th style="width: 40px; text-align: center;">م</th>
                    ${data.columns.map(col => `<th>${col.header}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${rowsToRender.map((row, idx) => `
                    <tr>
                      <td style="text-align: center; font-weight: bold; color: #64748b; background: #fafafa;">${idx + 1}</td>
                      ${data.columns.map(col => `<td>${row[col.key] !== undefined ? row[col.key] : '-'}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <div class="page-section no-split" style="margin-top: 35px; width: 100%;">
            <div style="display: flex; justify-content: space-between; gap: 20px;">
              <div style="flex: 1; border: 1px solid #006C70; padding: 18px; border-radius: 12px; text-align: center; background: #f8fafc;">
                <div style="font-weight: bold; color: #006C70; margin-bottom: 6px; font-size: 12px;">مُعدّ التقرير:</div>
                <div style="font-size: 15px; font-weight: 900; color: #0f172a;">${data.meta.preparer || '---'}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${data.meta.department || '---'}</div>
              </div>
              <div style="flex: 1; border: 1px solid #059669; padding: 18px; border-radius: 12px; text-align: center; background: #f0fdf4;">
                <div style="font-weight: bold; color: #059669; margin-bottom: 6px; font-size: 12px;">اعتماد صاحب الصلاحية:</div>
                <div style="font-size: 15px; font-weight: 900; color: #065f46;">${data.meta.approver || '---'}</div>
                <div style="font-size: 11px; color: #059669; font-weight: bold; margin-top: 2px;">معتمد إلكترونياً ورسمياً ✓</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            try {
              window.print();
            } catch (e) {
              console.log('Auto print exception:', e);
            }
          }, 350);
        };
      </script>
    </body>
  </html>
  `;

  // 1. Primary: Open in dedicated print window (clean, interactive, 100% reliable)
  try {
    const printWin = window.open('', '_blank', 'width=1150,height=850,scrollbars=yes,resizable=yes');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      return;
    }
  } catch (winErr) {
    console.warn('Pop-up print window blocked or failed, falling back to iframe overlay:', winErr);
  }

  // 2. Fallback: Frame/Iframe insertion
  const existingIframe = document.getElementById('report-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'report-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '100vw';
  iframe.style.height = '100vh';
  iframe.style.border = 'none';
  iframe.style.zIndex = '999999';
  iframe.style.background = '#ffffff';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Print iframe error:', err);
    }
  }, 400);
}

export const MOE_HEADER_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/7/76/Ministry_of_Education_%28Saudi_Arabia%29_%28logo%29.png';

/**
 * Helper to generate official Ministry logo PNG buffer for Word and Excel exports
 */
async function getMoeLogoBuffer(): Promise<Uint8Array | null> {
  try {
    const res = await fetch(MOE_HEADER_LOGO_URL);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return new Uint8Array(buffer);
    }
  } catch (err) {
    console.warn('Could not fetch logo image buffer directly:', err);
  }

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = MOE_HEADER_LOGO_URL;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 300;
    canvas.height = img.naturalHeight || 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const binaryStr = atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.warn('Canvas fallback failed:', err);
    return null;
  }
}

/**
 * 2. Export as Official Editable Word Document (.docx) with RTL properties
 */
export async function exportReportToWord(data: ReportExportData): Promise<Blob> {
  const orientation = analyzeIdealOrientation(data);
  const isLandscape = orientation === 'landscape';

  const logoBuffer = await getMoeLogoBuffer();

  const borderNone = {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE },
  };

  const cellBorderDark = {
    top: { style: BorderStyle.SINGLE, size: 6, color: '006C70' },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: '006C70' },
    left: { style: BorderStyle.SINGLE, size: 6, color: '006C70' },
    right: { style: BorderStyle.SINGLE, size: 6, color: '006C70' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '006C70' },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '006C70' },
  };

  const cellBorderLight = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '006C70' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '006C70' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '006C70' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '006C70' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '006C70' },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '006C70' },
  };

  // 1. Header Table (3 columns: Right = Kingdom Hierarchy, Center = Logo, Left = Ref/Date)
  const headerTable = new Table({
    visuallyRightToLeft: true,
    alignment: AlignmentType.RIGHT,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderNone,
    rows: [
      new TableRow({
        children: [
          // Cell 1 (Rightmost in RTL): Kingdom Hierarchy
          new TableCell({
            width: { size: 38, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                children: [new TextRun({ text: 'المملكة العربية السعودية', bold: true, size: 20, font: 'Cairo', rightToLeft: true })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                children: [new TextRun({ text: 'وزارة التعليم', bold: true, size: 20, font: 'Cairo', rightToLeft: true })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                children: [new TextRun({ text: 'إدارة التعليم بمنطقة المدينة المنورة', bold: true, size: 18, font: 'Cairo', rightToLeft: true })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                children: [new TextRun({ text: 'الشؤون التعليمية', bold: true, size: 18, font: 'Cairo', rightToLeft: true })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                children: [new TextRun({ text: 'وحدة القبول', bold: true, size: 20, font: 'Cairo', rightToLeft: true })]
              }),
            ]
          }),

          // Cell 2 (Center in RTL): Logo
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: logoBuffer ? [
                  new ImageRun({
                    data: logoBuffer,
                    type: 'png',
                    transformation: {
                      width: 105,
                      height: 72,
                    },
                  })
                ] : [
                  new TextRun({ text: 'وزارة التعليم\nMinistry of Education', bold: true, color: '006C70', size: 20, font: 'Cairo', rightToLeft: true })
                ]
              })
            ]
          }),

          // Cell 3 (Leftmost in RTL): Ref / Date
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            borders: borderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                children: [
                  new TextRun({ text: 'الرقم: ', bold: true, size: 19, font: 'Cairo', rightToLeft: true }),
                  new TextRun({ text: data.meta.reportNumber || '---', size: 19, font: 'Cairo', rightToLeft: true })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                children: [
                  new TextRun({ text: 'التاريخ: ', bold: true, size: 19, font: 'Cairo', rightToLeft: true }),
                  new TextRun({ text: data.meta.hijriDate || new Date().toLocaleDateString('ar-SA'), size: 19, font: 'Cairo', rightToLeft: true })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                children: [
                  new TextRun({ text: 'المرفقات: ', bold: true, size: 19, font: 'Cairo', rightToLeft: true }),
                  new TextRun({ text: 'لا يوجد', size: 19, font: 'Cairo', rightToLeft: true })
                ]
              }),
            ]
          }),
        ]
      })
    ]
  });

  // 2. Thick Dark Teal Divider Line
  const dividerLine = new Paragraph({
    spacing: { before: 120, after: 220 },
    border: {
      bottom: {
        color: "006C70",
        space: 1,
        size: 18, // 2.25 pt
        style: BorderStyle.SINGLE
      }
    },
    children: []
  });

  // 3. Main Report Title
  const titleParagraph = new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    bidirectional: true,
    spacing: { before: 100, after: 180 },
    children: [
      new TextRun({
        text: data.meta.title || 'التقرير الإحصائي العام لمعاملات وشكاوى القبول والتوجيه',
        bold: true,
        size: 32, // 16pt font
        color: '006C70',
        font: 'Cairo'
      })
    ]
  });

  // 4. Metadata Info Box (1 row, 3 cells) matching image 213
  const metaTable = new Table({
    visuallyRightToLeft: true,
    alignment: AlignmentType.CENTER,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBorderLight,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: cellBorderLight,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                children: [
                  new TextRun({ text: 'الجهة المصدرة: ', bold: true, size: 18, font: 'Cairo', rightToLeft: true }),
                  new TextRun({ text: data.meta.department || 'وحدة القبول والتوجيه الطلابي', size: 18, font: 'Cairo', rightToLeft: true })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: cellBorderLight,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                children: [
                  new TextRun({ text: 'تاريخ التقرير: ', bold: true, size: 18, font: 'Cairo', rightToLeft: true }),
                  new TextRun({ text: data.meta.hijriDate || new Date().toLocaleDateString('ar-SA'), size: 18, font: 'Cairo', rightToLeft: true })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: cellBorderLight,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                children: [
                  new TextRun({ text: 'رقم التقرير: ', bold: true, size: 18, font: 'Cairo', rightToLeft: true }),
                  new TextRun({ text: data.meta.reportNumber || 'ADM-628288', size: 18, font: 'Cairo', rightToLeft: true })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  // 5. Summary Section & Indicators Table (matching image 213)
  const summaryChildren: any[] = [];
  if (data.summaryItems && data.summaryItems.length > 0) {
    summaryChildren.push(
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: 'المؤشرات والمقاييس الإحصائية المعتمدة:',
            bold: true,
            size: 22,
            color: '006C70',
            font: 'Cairo',
            rightToLeft: true
          })
        ]
      }),
      new Table({
        visuallyRightToLeft: true,
        alignment: AlignmentType.CENTER,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: cellBorderDark,
        rows: [
          // Header Row
          new TableRow({
            children: [
              new TableCell({
                width: { size: 65, type: WidthType.PERCENTAGE },
                shading: { fill: '006C70' },
                borders: cellBorderDark,
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    bidirectional: true,
                    children: [new TextRun({ text: 'المؤشر الإحصائي', bold: true, color: 'FFFFFF', size: 20, font: 'Cairo', rightToLeft: true })]
                  })
                ]
              }),
              new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                shading: { fill: '006C70' },
                borders: cellBorderDark,
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    bidirectional: true,
                    children: [new TextRun({ text: 'القيمة / العدد', bold: true, color: 'FFFFFF', size: 20, font: 'Cairo', rightToLeft: true })]
                  })
                ]
              })
            ]
          }),
          // Data Rows
          ...data.summaryItems.map(item =>
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 65, type: WidthType.PERCENTAGE },
                  borders: cellBorderDark,
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      bidirectional: true,
                      children: [new TextRun({ text: item.label, bold: true, size: 19, font: 'Cairo', rightToLeft: true })]
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  borders: cellBorderDark,
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      bidirectional: true,
                      children: [new TextRun({ text: String(item.value), bold: true, color: '006C70', size: 20, font: 'Cairo', rightToLeft: true })]
                    })
                  ]
                })
              ]
            })
          )
        ]
      }),
      new Paragraph({ spacing: { after: 180 }, children: [] })
    );
  }

  // 6. Governorate Sections in Word
  const sectionChildren: any[] = [];
  if (data.sections && data.sections.length > 0) {
    sectionChildren.push(
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: 'توزيع المؤشرات الإحصائية المعتمدة حسب المحافظات والقطاعات:',
            bold: true,
            size: 24,
            color: '006C70',
            font: 'Cairo',
            rightToLeft: true
          })
        ]
      })
    );

    data.sections.forEach(sec => {
      sectionChildren.push(
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.CENTER,
          spacing: { before: 140, after: 60 },
          children: [
            new TextRun({ text: `📍 ${sec.name.includes('محافظة') || sec.name.includes('المدينة') ? sec.name : `محافظة ${sec.name}`}`, bold: true, size: 21, color: '006C70', font: 'Cairo', rightToLeft: true })
          ]
        }),
        new Table({
          visuallyRightToLeft: true,
          alignment: AlignmentType.CENTER,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: cellBorderDark,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 65, type: WidthType.PERCENTAGE },
                  shading: { fill: '006C70' },
                  borders: cellBorderDark,
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 90, bottom: 90, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      bidirectional: true,
                      children: [new TextRun({ text: 'المؤشر الإحصائي المعتمد', bold: true, color: 'FFFFFF', size: 20, font: 'Cairo', rightToLeft: true })]
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  shading: { fill: '006C70' },
                  borders: cellBorderDark,
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 90, bottom: 90, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      bidirectional: true,
                      children: [new TextRun({ text: 'القيمة / العدد', bold: true, color: 'FFFFFF', size: 20, font: 'Cairo', rightToLeft: true })]
                    })
                  ]
                })
              ]
            }),
            ...sec.summaryItems.map(item =>
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 65, type: WidthType.PERCENTAGE },
                    borders: cellBorderDark,
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        bidirectional: true,
                        children: [new TextRun({ text: item.label, bold: true, size: 19, font: 'Cairo', rightToLeft: true })]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 35, type: WidthType.PERCENTAGE },
                    borders: cellBorderDark,
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        bidirectional: true,
                        children: [new TextRun({ text: String(item.value), bold: true, color: '006C70', size: 20, font: 'Cairo', rightToLeft: true })]
                      })
                    ]
                  })
                ]
              })
            )
          ]
        }),
        new Paragraph({ spacing: { after: 140 }, children: [] })
      );
    });
  }

  // 7. Data Rows Table (if present)
  const rowsChildren: any[] = [];
  if (data.rows && data.rows.length > 0 && data.columns && data.columns.length > 0) {
    rowsChildren.push(
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({ text: 'البيانات التفصيلية والمعاملات المسجلة:', bold: true, size: 22, color: '006C70', font: 'Cairo', rightToLeft: true })
        ]
      }),
      new Table({
        visuallyRightToLeft: true,
        alignment: AlignmentType.CENTER,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: cellBorderDark,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: '006C70' },
                borders: cellBorderDark,
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    bidirectional: true,
                    children: [new TextRun({ text: 'م', bold: true, color: 'FFFFFF', size: 19, font: 'Cairo', rightToLeft: true })]
                  })
                ]
              }),
              ...data.columns.map(col =>
                new TableCell({
                  shading: { fill: '006C70' },
                  borders: cellBorderDark,
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 100, bottom: 100, left: 80, right: 80 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      bidirectional: true,
                      children: [new TextRun({ text: col.header, bold: true, color: 'FFFFFF', size: 19, font: 'Cairo', rightToLeft: true })]
                    })
                  ]
                })
              )
            ]
          }),
          ...data.rows.map((row, rIdx) =>
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorderDark,
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 70, bottom: 70, left: 80, right: 80 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      bidirectional: true,
                      children: [new TextRun({ text: String(rIdx + 1), bold: true, size: 18, font: 'Cairo', rightToLeft: true })]
                    })
                  ]
                }),
                ...data.columns.map(col =>
                  new TableCell({
                    borders: cellBorderDark,
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 70, bottom: 70, left: 80, right: 80 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        bidirectional: true,
                        children: [new TextRun({ text: String(row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '-'), size: 18, font: 'Cairo', rightToLeft: true })]
                      })
                    ]
                  })
                )
              ]
            })
          )
        ]
      })
    );
  }

  // Narrative text
  const narrativeChildren: any[] = [];
  if (data.narrativeText && data.narrativeText.length > 0) {
    data.narrativeText.forEach(para => {
      narrativeChildren.push(
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({ text: para, size: 20, font: 'Cairo', rightToLeft: true })
          ]
        })
      );
    });
  }

  // 8. Signatures Section
  const signatureTable = new Table({
    visuallyRightToLeft: true,
    alignment: AlignmentType.RIGHT,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderNone,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: borderNone,
            children: [
              new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'مُعدّ التقرير:\n', bold: true, color: '006C70', font: 'Cairo', rightToLeft: true }),
                  new TextRun({ text: `${data.meta.preparer || 'وحدة القبول'}\n`, bold: true, font: 'Cairo', rightToLeft: true }),
                  new TextRun({ text: data.meta.department || 'إدارة التعليم بمنطقة المدينة المنورة', size: 18, color: '64748b', font: 'Cairo', rightToLeft: true })
                ]
              })
            ]
          }),
          new TableCell({
            borders: borderNone,
            children: [
              new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'اعتماد صاحب الصلاحية:\n', bold: true, color: '006C70', font: 'Cairo', rightToLeft: true }),
                  new TextRun({ text: `${data.meta.approver || 'مدير إدارة التعليم'}\n`, bold: true, font: 'Cairo', rightToLeft: true }),
                  new TextRun({ text: 'معتمد إلكترونياً ورسمياً من المنظومة ✓', size: 18, color: '059669', font: 'Cairo', rightToLeft: true })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

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
          headerTable,
          dividerLine,
          titleParagraph,
          metaTable,
          new Paragraph({ spacing: { after: 120 }, children: [] }),
          ...summaryChildren,
          ...sectionChildren,
          ...narrativeChildren,
          ...rowsChildren,
          new Paragraph({ spacing: { after: 250 }, children: [] }),
          signatureTable
        ]
      }
    ]
  });

  return await Packer.toBlob(doc);
}

/**
 * 3. Export as Structured Excel Workbook (.xlsx) with Professional Styling & RTL sheets
 */
export async function exportReportToExcel(data: ReportExportData): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'نظام القبول والتوجيه الطلابي';
  wb.lastModifiedBy = 'وحدة القبول والتوجيه الطلابي';
  wb.created = new Date();

  // Load official Ministry Logo buffer
  const logoBuffer = await getMoeLogoBuffer();
  let logoImageId: number | undefined;
  if (logoBuffer) {
    logoImageId = wb.addImage({
      buffer: logoBuffer.buffer as ArrayBuffer,
      extension: 'png',
    });
  }

  // Color Palette (Official Deep Teal Theme matching UI & Reports)
  const COLOR_HEADER_BG = 'FF006C70';      // Primary Deep Teal
  const COLOR_SUBHEADER_BG = 'FFE0F2F1';   // Soft Mint/Teal
  const COLOR_CARD_TITLE_BG = 'FF004D40';  // Dark Teal Accent
  const COLOR_ZEBRA_EVEN = 'FFF4F9F9';     // Very light mint zebra
  const COLOR_ZEBRA_ODD = 'FFFFFFFF';      // White
  const COLOR_BORDER_DARK = 'FF006C70';    // Dark Teal Border
  const COLOR_BORDER_LIGHT = 'FFCBD5E1';   // Slate Light Border

  const fontCairo15BoldWhite: Partial<ExcelJS.Font> = { name: 'Cairo', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontCairo12BoldWhite: Partial<ExcelJS.Font> = { name: 'Cairo', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontCairo10BoldWhite: Partial<ExcelJS.Font> = { name: 'Cairo', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontCairo11BoldTeal: Partial<ExcelJS.Font> = { name: 'Cairo', size: 11, bold: true, color: { argb: 'FF004D40' } };
  const fontCairo10Regular: Partial<ExcelJS.Font> = { name: 'Cairo', size: 10, color: { argb: 'FF1E293B' } };
  const fontCairo10Bold: Partial<ExcelJS.Font> = { name: 'Cairo', size: 10, bold: true, color: { argb: 'FF0F172A' } };

  const borderDark: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: COLOR_BORDER_DARK } },
    bottom: { style: 'thin', color: { argb: COLOR_BORDER_DARK } },
    left: { style: 'thin', color: { argb: COLOR_BORDER_DARK } },
    right: { style: 'thin', color: { argb: COLOR_BORDER_DARK } },
  };

  const borderLight: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: COLOR_BORDER_LIGHT } },
    bottom: { style: 'thin', color: { argb: COLOR_BORDER_LIGHT } },
    left: { style: 'thin', color: { argb: COLOR_BORDER_LIGHT } },
    right: { style: 'thin', color: { argb: COLOR_BORDER_LIGHT } },
  };

  const alignCenterMiddle: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center', wrapText: true };

  // ==========================================
  // SHEET 1: EXECUTIVE SUMMARY («ملخص التقرير»)
  // ==========================================
  const wsSummary = wb.addWorksheet('ملخص التقرير', { views: [{ rightToLeft: true }] });
  
  // Set Column Widths
  wsSummary.columns = [
    { width: 32 },
    { width: 32 },
    { width: 25 },
    { width: 25 },
    { width: 25 }
  ];

  // Title Banner (A1:E2)
  wsSummary.getRow(1).height = 24;
  wsSummary.getRow(2).height = 24;
  wsSummary.mergeCells('A1:E2');
  const summaryTitle = wsSummary.getCell('A1');
  summaryTitle.value = data.meta.title || 'التقرير الإحصائي العام لمعاملات وشكاوى القبول والتوجيه';
  summaryTitle.font = fontCairo15BoldWhite;
  summaryTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
  summaryTitle.alignment = alignCenterMiddle;

  // Official Logo Embedding
  if (logoImageId !== undefined) {
    wsSummary.addImage(logoImageId, {
      tl: { col: 2, row: 0.1 },
      ext: { width: 110, height: 70 },
      editAs: 'oneCell'
    });
  }

  // Subheader Banner (A3:E3)
  wsSummary.getRow(3).height = 26;
  wsSummary.mergeCells('A3:E3');
  const summarySub = wsSummary.getCell('A3');
  summarySub.value = 'المملكة العربية السعودية | وزارة التعليم | الإدارة العامة للتعليم بمنطقة المدينة المنورة | وحدة القبول والتوجيه';
  summarySub.font = fontCairo11BoldTeal;
  summarySub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBHEADER_BG } };
  summarySub.alignment = alignCenterMiddle;

  // Metadata Card Grid (Rows 5..7)
  const metaPairs = [
    ['الجهة المصدرة:', data.meta.department || 'وحدة القبول والتوجيه الطلابي', 'تاريخ التقرير:', data.meta.hijriDate || new Date().toLocaleDateString('ar-SA')],
    ['رقم التقرير الإسنادي:', data.meta.reportNumber || 'ADM-628288', 'حالة الاعتماد:', 'معتمد إلكترونياً ورسمياً من المنظومة ✓'],
    ['مُعدّ التقرير:', data.meta.preparer || 'وحدة القبول', 'اعتماد صاحب الصلاحية:', data.meta.approver || 'مدير إدارة التعليم']
  ];

  let currRowIdx = 5;
  metaPairs.forEach(rowVals => {
    const row = wsSummary.getRow(currRowIdx);
    row.height = 22;
    
    // Key 1
    row.getCell(1).value = rowVals[0];
    row.getCell(1).font = fontCairo10Bold;
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBHEADER_BG } };
    row.getCell(1).alignment = alignCenterMiddle;
    row.getCell(1).border = borderLight;

    // Value 1
    row.getCell(2).value = rowVals[1];
    row.getCell(2).font = fontCairo10Regular;
    row.getCell(2).alignment = alignCenterMiddle;
    row.getCell(2).border = borderLight;

    // Key 2
    row.getCell(3).value = rowVals[2];
    row.getCell(3).font = fontCairo10Bold;
    row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBHEADER_BG } };
    row.getCell(3).alignment = alignCenterMiddle;
    row.getCell(3).border = borderLight;

    // Value 2
    wsSummary.mergeCells(`D${currRowIdx}:E${currRowIdx}`);
    const val2Cell = row.getCell(4);
    val2Cell.value = rowVals[3];
    val2Cell.font = rowVals[3].includes('✓') ? { ...fontCairo10Bold, color: { argb: 'FF059669' } } : fontCairo10Regular;
    val2Cell.alignment = alignCenterMiddle;
    val2Cell.border = borderLight;

    currRowIdx++;
  });

  currRowIdx += 1;

  // Summary Indicators Table
  if (data.summaryItems && data.summaryItems.length > 0) {
    wsSummary.getRow(currRowIdx).height = 26;
    wsSummary.mergeCells(`A${currRowIdx}:E${currRowIdx}`);
    const secHeader = wsSummary.getCell(`A${currRowIdx}`);
    secHeader.value = 'المؤشرات والمقاييس الإحصائية المعتمدة';
    secHeader.font = fontCairo12BoldWhite;
    secHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
    secHeader.alignment = alignCenterMiddle;
    currRowIdx++;

    // Header Row
    wsSummary.getRow(currRowIdx).height = 24;
    wsSummary.mergeCells(`A${currRowIdx}:C${currRowIdx}`);
    const thLabel = wsSummary.getCell(`A${currRowIdx}`);
    thLabel.value = 'المؤشر الإحصائي المعتمد';
    thLabel.font = fontCairo10BoldWhite;
    thLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_CARD_TITLE_BG } };
    thLabel.alignment = alignCenterMiddle;
    thLabel.border = borderDark;

    wsSummary.mergeCells(`D${currRowIdx}:E${currRowIdx}`);
    const thVal = wsSummary.getCell(`D${currRowIdx}`);
    thVal.value = 'القيمة / العدد';
    thVal.font = fontCairo10BoldWhite;
    thVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_CARD_TITLE_BG } };
    thVal.alignment = alignCenterMiddle;
    thVal.border = borderDark;

    currRowIdx++;

    // Data Rows
    data.summaryItems.forEach((item, idx) => {
      wsSummary.getRow(currRowIdx).height = 22;
      const isEven = idx % 2 === 0;
      const rowBg = isEven ? COLOR_ZEBRA_EVEN : COLOR_ZEBRA_ODD;

      wsSummary.mergeCells(`A${currRowIdx}:C${currRowIdx}`);
      const cLabel = wsSummary.getCell(`A${currRowIdx}`);
      cLabel.value = item.label;
      cLabel.font = fontCairo10Bold;
      cLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cLabel.alignment = alignCenterMiddle;
      cLabel.border = borderLight;

      wsSummary.mergeCells(`D${currRowIdx}:E${currRowIdx}`);
      const cVal = wsSummary.getCell(`D${currRowIdx}`);
      cVal.value = item.value;
      cVal.font = { name: 'Cairo', size: 11, bold: true, color: { argb: 'FF006C70' } };
      cVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cVal.alignment = alignCenterMiddle;
      cVal.border = borderLight;

      currRowIdx++;
    });
  }

  // ==========================================
  // SHEET 2: GOVERNORATE MATRIX («مؤشرات المحافظات»)
  // ==========================================
  if (data.sections && data.sections.length > 0) {
    const wsGov = wb.addWorksheet('مؤشرات المحافظات', { views: [{ rightToLeft: true }] });
    
    const labels = data.sections[0].summaryItems.map(si => si.label);
    const totalCols = labels.length + 1;
    
    wsGov.getRow(1).height = 24;
    wsGov.getRow(2).height = 24;

    const colEndChar = String.fromCharCode(65 + Math.min(totalCols - 1, 25));
    wsGov.mergeCells(`A1:${colEndChar}2`);
    const govTitle = wsGov.getCell('A1');
    govTitle.value = 'مصفوفة المؤشرات الإحصائية المعتمدة حسب المحافظات والقطاعات';
    govTitle.font = fontCairo15BoldWhite;
    govTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
    govTitle.alignment = alignCenterMiddle;

    // Header Row (Row 4)
    const headerRow = wsGov.getRow(4);
    headerRow.height = 32;
    
    headerRow.getCell(1).value = 'المحافظة / القطاع';
    headerRow.getCell(1).font = fontCairo10BoldWhite;
    headerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_CARD_TITLE_BG } };
    headerRow.getCell(1).alignment = alignCenterMiddle;
    headerRow.getCell(1).border = borderDark;

    labels.forEach((lbl, lIdx) => {
      const cell = headerRow.getCell(lIdx + 2);
      cell.value = lbl;
      cell.font = fontCairo10BoldWhite;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
      cell.alignment = alignCenterMiddle;
      cell.border = borderDark;
    });

    // Data Rows
    let gRowIdx = 5;
    data.sections.forEach((sec, sIdx) => {
      const row = wsGov.getRow(gRowIdx);
      row.height = 24;
      const isEven = sIdx % 2 === 0;
      const rowBg = isEven ? COLOR_ZEBRA_EVEN : COLOR_ZEBRA_ODD;

      const cGov = row.getCell(1);
      cGov.value = sec.name.includes('محافظة') || sec.name.includes('المدينة') ? sec.name : `محافظة ${sec.name}`;
      cGov.font = fontCairo10Bold;
      cGov.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBHEADER_BG } };
      cGov.alignment = alignCenterMiddle;
      cGov.border = borderDark;

      sec.summaryItems.forEach((si, siIdx) => {
        const cVal = row.getCell(siIdx + 2);
        cVal.value = si.value;
        cVal.font = fontCairo10Bold;
        cVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        cVal.alignment = alignCenterMiddle;
        cVal.border = borderLight;
      });

      gRowIdx++;
    });

    // Auto Column Widths
    wsGov.getColumn(1).width = 28;
    for (let c = 2; c <= totalCols; c++) {
      wsGov.getColumn(c).width = 22;
    }
  }

  // ==========================================
  // SHEET 3: DETAILED RECORDS («البيانات التفصيلية»)
  // ==========================================
  if (data.rows && data.rows.length > 0 && data.columns && data.columns.length > 0) {
    const wsData = wb.addWorksheet('البيانات التفصيلية', { views: [{ rightToLeft: true }] });

    const totalCols = data.columns.length + 1;
    const colEndChar = String.fromCharCode(65 + Math.min(totalCols - 1, 25));

    wsData.getRow(1).height = 24;
    wsData.getRow(2).height = 24;
    wsData.mergeCells(`A1:${colEndChar}2`);
    const dataTitle = wsData.getCell('A1');
    dataTitle.value = 'سجلات البيانات المعاملات والطلبات التفصيلية';
    dataTitle.font = fontCairo15BoldWhite;
    dataTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
    dataTitle.alignment = alignCenterMiddle;

    if (logoImageId !== undefined) {
      wsData.addImage(logoImageId, {
        tl: { col: Math.max(1, Math.floor(totalCols / 2) - 1), row: 0.1 },
        ext: { width: 110, height: 70 },
        editAs: 'oneCell'
      });
    }

    // Table Header Row (Row 4)
    const headerRow = wsData.getRow(4);
    headerRow.height = 30;

    headerRow.getCell(1).value = 'م';
    headerRow.getCell(1).font = fontCairo10BoldWhite;
    headerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_CARD_TITLE_BG } };
    headerRow.getCell(1).alignment = alignCenterMiddle;
    headerRow.getCell(1).border = borderDark;

    data.columns.forEach((col, cIdx) => {
      const cell = headerRow.getCell(cIdx + 2);
      cell.value = col.header;
      cell.font = fontCairo10BoldWhite;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
      cell.alignment = alignCenterMiddle;
      cell.border = borderDark;
    });

    // Data Rows
    let dRowIdx = 5;
    data.rows.forEach((row, rIdx) => {
      const rowObj = wsData.getRow(dRowIdx);
      rowObj.height = 22;
      const isEven = rIdx % 2 === 0;
      const rowBg = isEven ? COLOR_ZEBRA_EVEN : COLOR_ZEBRA_ODD;

      const cSeq = rowObj.getCell(1);
      cSeq.value = rIdx + 1;
      cSeq.font = fontCairo10Bold;
      cSeq.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SUBHEADER_BG } };
      cSeq.alignment = alignCenterMiddle;
      cSeq.border = borderLight;

      data.columns.forEach((col, cIdx) => {
        const cVal = rowObj.getCell(cIdx + 2);
        const val = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '-';
        cVal.value = val;
        cVal.font = fontCairo10Regular;
        cVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        cVal.alignment = alignCenterMiddle;
        cVal.border = borderLight;
      });

      dRowIdx++;
    });

    // Auto Column Widths
    wsData.getColumn(1).width = 8;
    data.columns.forEach((col, cIdx) => {
      const maxLen = Math.max(
        col.header.length,
        ...data.rows.slice(0, 50).map(r => String(r[col.key] || '').length)
      );
      wsData.getColumn(cIdx + 2).width = Math.max(18, Math.min(maxLen + 4, 45));
    });
  }

  // Generate Excel Buffer & Blob
  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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
  const excelBlob = await exportReportToExcel(data);
  zip.file(`${baseName}.xlsx`, excelBlob);

  // Generate Zip Blob
  return await zip.generateAsync({ type: 'blob' });
}
