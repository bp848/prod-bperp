

import { User } from './types.ts';

declare const jspdf: any;
declare const html2canvas: any;

const getImportMetaEnv = (): Record<string, string | undefined> | undefined => {
  try {
    // `import.meta` may be undefined in some runtimes (e.g. Node during testing)
    return (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined) as
      | Record<string, string | undefined>
      | undefined;
  } catch (error) {
    console.warn('Failed to access import.meta.env:', error);
    return undefined;
  }
};

// FIX: isValidEnvString to be more robust by checking for "YOUR_" placeholders and strictly empty strings
const isValidEnvString = (value: string | null | undefined): boolean => {
  return !!(value && value.trim() !== '' && !value.toUpperCase().includes('YOUR_'));
};

export const getEnvValue = (key: string): string | undefined => {
  // Special handling for SITE_URL to prioritize localStorage and NEXT_PUBLIC_SITE_URL
  if (key === 'SITE_URL') {
    // Priority 1: localStorage (user-saved via settings or AppSiteUrlModal)
    // FIX: Use `appSiteUrl` from localStorage. This is explicitly set in SettingsPage and AppSiteUrlModal.
    const localSiteUrl = localStorage.getItem('appSiteUrl');
    if (isValidEnvString(localSiteUrl)) {
      console.log("getEnvValue('SITE_URL') - Using localStorage 'appSiteUrl'.");
      return localSiteUrl;
    }

    // Priority 2: NEXT_PUBLIC_SITE_URL from process.env (for Node-like environments)
    const nextPublicProcessEnv = (typeof process !== 'undefined' && process.env) ? process.env['NEXT_PUBLIC_SITE_URL'] : undefined;
    if (isValidEnvString(nextPublicProcessEnv)) {
      console.log("getEnvValue('SITE_URL') - Using process.env.NEXT_PUBLIC_SITE_URL.");
      return nextPublicProcessEnv;
    }

    // Priority 3: NEXT_PUBLIC_SITE_URL from import.meta.env (for Vite/Webpack-like environments)
    const metaEnv = getImportMetaEnv();
    const nextPublicMetaEnv = metaEnv ? metaEnv['NEXT_PUBLIC_SITE_URL'] : undefined;
    if (isValidEnvString(nextPublicMetaEnv)) {
      console.log("getEnvValue('SITE_URL') - Using import.meta.env.NEXT_PUBLIC_SITE_URL.");
      return nextPublicMetaEnv;
    }
  }

  // General checks for other keys or if SITE_URL wasn't found in NEXT_PUBLIC_ or localStorage
  // Priority 4: Direct key from process.env
  const directProcessEnv = (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined;
  if (isValidEnvString(directProcessEnv)) {
    console.log(`getEnvValue('${key}') - Using process.env.${key}.`);
    return directProcessEnv;
  }

  // Priority 5: Direct key from import.meta.env
  const metaEnv = getImportMetaEnv(); // Re-get in case it wasn't fetched above
  const directMetaEnv = metaEnv ? metaEnv[key] : undefined;
  if (isValidEnvString(directMetaEnv)) {
    console.log(`getEnvValue('${key}') - Using import.meta.env.${key}.`);
    return directMetaEnv;
  }

  // Priority 6: VITE_ prefix from import.meta.env
  const viteMetaEnv = metaEnv ? metaEnv[`VITE_${key}`] : undefined;
  if (isValidEnvString(viteMetaEnv)) {
    console.log(`getEnvValue('${key}') - Using import.meta.env.VITE_${key}.`);
    return viteMetaEnv;
  }
  
  // Priority 7: NEXT_PUBLIC_ prefix for general keys (if not handled for SITE_URL specifically)
  const nextPublicGeneralMetaEnv = metaEnv ? metaEnv[`NEXT_PUBLIC_${key}`] : undefined;
  if (isValidEnvString(nextPublicGeneralMetaEnv)) {
    console.log(`getEnvValue('${key}') - Using import.meta.env.NEXT_PUBLIC_${key}.`);
    return nextPublicGeneralMetaEnv;
  }
  const nextPublicGeneralProcessEnv = (typeof process !== 'undefined' && process.env) ? process.env[`NEXT_PUBLIC_${key}`] : undefined;
  if (isValidEnvString(nextPublicGeneralProcessEnv)) {
    console.log(`getEnvValue('${key}') - Using process.env.NEXT_PUBLIC_${key}.`);
    return nextPublicGeneralProcessEnv;
  }

  console.log(`getEnvValue('${key}') - No valid value found.`);
  return undefined;
};


export const formatJPY = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(Math.round(amount));
};

export const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (e) {
    return String(dateString);
  }
};

export const formatDateTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    //toLocaleString can produce slightly different formats, so we build it manually
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    return String(dateString);
  }
};

export const createSignature = (): string => {
    try {
        const settingsStr = localStorage.getItem('signatureSettings');
        const settings = settingsStr ? JSON.parse(settingsStr) : null;
        
        const companyName = settings?.companyName || '文唱堂印刷株式会社';
        const address = '〒101-0025 東京都千代田区神田佐久間町3-37';
        const phone = settings?.phone || 'TEL：03-3851-0111　FAX：03-3861-1979';
        const department = settings?.department || 'システム管理・開発';
        const name = settings?.yourName || '石嶋 洋平';
        const email = settings?.email || 'sales.system@mqprint.co.jp';
        const website = settings?.website;

        let signature = `\n\n---------------------------------------
${companyName}
${address}
${phone}
${department}
${name}
E-mail：${email}`;
        
        if (website) {
            signature += `\n${website}`;
        }

        signature += `
---------------------------------------`;
        
        return signature;

    } catch (error) {
        console.error("Failed to create signature:", error);
        // Fallback to a hardcoded default in case of any error
        return `\n\n---------------------------------------
文唱堂印刷株式会社
〒101-0025 東京都千代田区神田佐久間町3-37
TEL：03-3851-0111　FAX：03-3861-1979
システム管理・開発
石嶋 洋平
E-mail：sales.system@mqprint.co.jp
---------------------------------------`;
    }
};

export const generateMultipagePdf = async (elementId: string, fileName: string): Promise<void> => {
    const input = document.getElementById(elementId);
    if (!input) {
      throw new Error(`Element with id '${elementId}' not found.`);
    }

    const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: true,
        width: input.scrollWidth,
        height: input.scrollHeight,
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight,
    });

    const pdf = new jspdf.jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    const ratio = canvasWidth / pdfWidth;
    const canvasRenderedHeight = canvasHeight / ratio;

    let position = 0;
    let pageCount = 1;
    const totalPages = Math.ceil(canvasRenderedHeight / pdfHeight);

    while (position < canvasRenderedHeight) {
        if (pageCount > 1) {
            pdf.addPage();
        }
        
        pdf.addImage(canvas, 'PNG', 0, -position, pdfWidth, canvasRenderedHeight);

        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(
            `Page ${pageCount} of ${totalPages}`,
            pdfWidth / 2,
            pdfHeight - 10,
            { align: 'center' }
        );

        position += pdfHeight;
        pageCount++;
    }

    pdf.save(fileName);
};