import { GoogleGenAI, Type, GenerateContentResponse, Chat, Modality, FunctionDeclaration, Blob, LiveServerMessage } from "@google/genai";
import { AISuggestions, Customer, CompanyAnalysis, InvoiceData, AIJournalSuggestion, User, ApplicationCode, Estimate, EstimateLineItem, ApprovalRoute, Job, LeadStatus, JournalEntry, Application, ApplicationWithDetails, CompanyInvestigation, CustomProposalContent, LeadProposalPackage, MarketResearchReport, EstimateDraft, ExtractedParty, GeneratedEmailContent, UUID, Project, AllocationDivision, AccountItem, Lead } from '../types.ts';
import { formatJPY, createSignature, getEnvValue } from "../utils.ts";
// FIX: Add missing import for uuidv4
import { v4 as uuidv4 } from 'uuid';

const API_KEY = getEnvValue('API_KEY') ?? getEnvValue('GEMINI_API_KEY');

// FIX: Helper to initialize GoogleGenAI
const getGenAI = () => {
    if (!API_KEY) {
        throw new Error('AI API Key is not configured. Please check your .env file or settings.');
    }
    return new GoogleGenAI({ apiKey: API_KEY });
};

// FIX: Export AI functions to resolve "Module has no exported member" errors.

// --- Job Related AI Functions ---
export async function suggestJobParameters(prompt: string, paperTypes: string[], finishingOptions: string[]): Promise<AISuggestions> {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // Basic text task
        contents: `ユーザーは新しい印刷案件を作成しようとしています。以下の情報に基づいて、案件のパラメータを提案してください。
        利用可能な用紙タイプ: ${paperTypes.join(', ')}
        利用可能な加工オプション: ${finishingOptions.join(', ')}
        
        ユーザーからの依頼内容: "${prompt}"
        
        提案する案件のJSON形式:
        {
          "title": "案件タイトル",
          "quantity": 1000,
          "paperType": "選択された用紙タイプ",
          "finishing": "選択された加工オプション",
          "details": "案件の詳細説明",
          "price": 0, // 提案価格
          "variableCost": 0 // 提案変動費
        }
        
        注: priceとvariableCostは、一般的な相場に基づいて大まかな数値を提案してください。`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    paperType: { type: Type.STRING, enum: paperTypes },
                    finishing: { type: Type.STRING, enum: finishingOptions },
                    details: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                    variableCost: { type: Type.NUMBER },
                },
                required: ["title", "quantity", "paperType", "finishing", "details", "price", "variableCost"]
            },
        },
    });
    const text = response.text.trim().replace(/^```json\n|\n```$/g, '');
    return JSON.parse(text);
}

// --- Invoice OCR Related AI Functions ---
export async function extractInvoiceDetails(base64Image: string, mimeType: string, accountItems: AccountItem[], allocationDivisions: AllocationDivision[]): Promise<InvoiceData> {
    const ai = getGenAI();
    
    // Create a simplified list of account item names and allocation division names
    const accountNames = accountItems.map(item => item.name);
    const allocationNames = allocationDivisions.map(div => div.name);

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // Image analysis task
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Image,
                    },
                },
                {
                    text: `以下の請求書画像から、発行元、日付、合計金額、内容、費用種別（変動費 'V' または固定費 'F'）、勘定科目、振分区分、関連する顧客名、プロジェクト名を抽出してください。
                    勘定科目: ${accountNames.join(', ')}の中から最も適切なものを選択してください。
                    振分区分: ${allocationNames.join(', ')}の中から最も適切なものを選択してください。
                    費用種別は通常'F'ですが、印刷や加工に直接関連する場合は'V'と判断してください。
                    JSON形式で出力してください。
                    例:
                    {
                        "vendorName": "発行元",
                        "invoiceDate": "YYYY-MM-DD",
                        "totalAmount": 12345,
                        "description": "内容",
                        "costType": "F",
                        "account": "勘定科目名",
                        "allocationDivision": "振分区分名",
                        "relatedCustomer": "顧客名 (該当する場合)",
                        "project": "プロジェクト名 (該当する場合)"
                    }`
                },
            ],
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    vendorName: { type: Type.STRING },
                    invoiceDate: { type: Type.STRING, format: "date" },
                    totalAmount: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                    costType: { type: Type.STRING, enum: ['V', 'F'] },
                    account: { type: Type.STRING, enum: accountNames },
                    allocationDivision: { type: Type.STRING, enum: allocationNames },
                    relatedCustomer: { type: Type.STRING, nullable: true },
                    project: { type: Type.STRING, nullable: true },
                },
                required: ["vendorName", "invoiceDate", "totalAmount", "description", "costType", "account", "allocationDivision"]
            },
        },
    });
    const text = response.text.trim().replace(/^```json\n|\n```$/g, '');
    return JSON.parse(text);
}


// --- Journal Entry Related AI Functions ---
export async function suggestJournalEntry(prompt: string): Promise<AIJournalSuggestion> {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // Basic text task
        contents: `以下の内容から最も適切な会計仕訳をJSON形式で提案してください。
        例: "カフェでミーティング、コーヒー代1000円" -> {"account": "会議費", "description": "カフェミーティング", "debit": 1000, "credit": 0}
        勘定科目は一般的なものを使用してください。借方と貸方のどちらか片方のみに金額を入力してください。
        
        依頼内容: "${prompt}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    account: { type: Type.STRING },
                    description: { type: Type.STRING },
                    debit: { type: Type.NUMBER },
                    credit: { type: Type.NUMBER },
                },
                required: ["account", "description", "debit", "credit"]
            },
        },
    });
    const text = response.text.trim().replace(/^```json\n|\n```$/g, '');
    return JSON.parse(text);
}

// --- Customer Related AI Functions ---
export async function generateSalesEmail(customer: Customer, senderName: string): Promise<GeneratedEmailContent> {
    const ai = getGenAI();
    const prompt = `以下の顧客情報に基づいて、新規営業の提案メールの件名と本文を作成してください。
    顧客名: ${customer.customerName}
    担当者名: ${customer.representative || 'ご担当者様'}
    顧客の事業内容: ${customer.companyContent || '不明'}
    顧客の潜在的なニーズや課題: ${customer.infoRequirements || '不明'}
    
    件名と本文をJSON形式で出力してください。
    本文では、顧客のビジネスを理解していることを示し、潜在的な課題解決に貢献できるような内容を盛り込んでください。
    「[あなたの名前]」は送信者の名前に置き換えてください。
    
    JSON形式の例:
    {
      "subject": "〇〇株式会社様へのご提案",
      "bodyText": "本文...\n[あなたの名前]"
    }`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    subject: { type: Type.STRING },
                    bodyText: { type: Type.STRING },
                },
                required: ["subject", "bodyText"]
            },
        },
    });
    const text = response.text.trim().replace(/^```json\n|\n```$/g, '');
    const generatedEmail = JSON.parse(text);
    // Replace placeholder with actual sender name
    generatedEmail.bodyText = generatedEmail.bodyText.replace(/\[あなたの名前\]/g, senderName);
    return generatedEmail;
}

export async function enrichCustomerData(companyName: string): Promise<Partial<Customer>> {
    const ai = getGenAI();
    const prompt = `"${companyName}" という会社についてWebから情報を収集し、以下の項目を埋めてください。
    - 会社名
    - WebサイトURL
    - 所在地（郵便番号、住所1、住所2）
    - 設立年月日 (YYYY-MM-DD形式)
    - 資本金
    - 年商
    - 従業員数
    - 事業内容
    - 顧客ランク (例: A, B, C)
    - 営業活動情報（Webサイトやニュースから推測される最近の活動）
    
    JSON形式で出力してください。
    不明な項目はnullとしてください。`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro", // Complex text task
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    customerName: { type: Type.STRING, nullable: true },
                    websiteUrl: { type: Type.STRING, nullable: true },
                    zipCode: { type: Type.STRING, nullable: true },
                    address1: { type: Type.STRING, nullable: true },
                    address2: { type: Type.STRING, nullable: true },
                    foundationDate: { type: Type.STRING, format: "date", nullable: true },
                    capital: { type: Type.STRING, nullable: true },
                    annualSales: { type: Type.STRING, nullable: true },
                    employeesCount: { type: Type.STRING, nullable: true },
                    companyContent: { type: Type.STRING, nullable: true },
                    customerRank: { type: Type.STRING, nullable: true },
                    infoSalesActivity: { type: Type.STRING, nullable: true },
                },
            },
        },
    });
    const text = response.text.trim().replace(/^```json\n|\n```$/g, '');
    return JSON.parse(text);
}

export async function analyzeCompany(customer: Customer): Promise<CompanyAnalysis> {
    const ai = getGenAI();
    const prompt = `以下の顧客情報とWeb上の公開情報に基づいて、SWOT分析、顧客の課題と潜在的ニーズ、提案アクション、および提案メールを作成してください。
    顧客名: ${customer.customerName}
    事業内容: ${customer.companyContent || '不明'}
    Webサイト: ${customer.websiteUrl || '不明'}
    既存の営業情報: ${customer.infoSalesActivity || 'なし'}
    
    結果をJSON形式で出力してください。
    
    JSON形式の例:
    {
      "swot": "強み、弱み、機会、脅威",
      "painPointsAndNeeds": "顧客が抱える課題と、それに対する潜在的なニーズ",
      "suggestedActions": "弊社が提案できる具体的なアクションやソリューション",
      "proposalEmail": {
        "subject": "〇〇株式会社様へのご提案",
        "body": "本文...\n[あなたの名前]"
      },
      "sources": [{"uri": "...", "title": "..."}] // 参照元URL (あれば)
    }`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    swot: { type: Type.STRING },
                    painPointsAndNeeds: { type: Type.STRING },
                    suggestedActions: { type: Type.STRING },
                    proposalEmail: {
                        type: Type.OBJECT,
                        properties: {
                            subject: { type: Type.STRING },
                            body: { type: Type.STRING },
                        },
                        required: ["subject", "body"]
                    },
                    sources: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                uri: { type: Type.STRING },
                                title: { type: Type.STRING, nullable: true },
                            },
                        },
                        nullable: true,
                    },
                },
                required: ["swot", "painPointsAndNeeds", "suggestedActions", "proposalEmail"]
            },
        },
    });
    const text = response.text.trim().replace(/^```json\n|\n```$/g, '');
    const result = JSON.parse(text);
    result.sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean) || [];
    return result;
}

// --- Proposal Related AI Functions ---
export async function generateProposalSection(sectionTitle: string, customer: Customer, job: Job | null, estimate: Estimate | null): Promise<string> {
    const ai = getGenAI();
    let context = `以下の顧客情報に基づいて、「${sectionTitle}」の提案書セクションを記述してください。`;
    if (customer) {
        context += `\n\n顧客名: ${customer.customerName}`;
        context += `\n事業内容: ${customer.companyContent || '不明'}`;
        context += `\n既存の営業情報: ${customer.infoSalesActivity || 'なし'}`;
        context += `\n課題: ${customer.infoRequirements || 'なし'}`;
    }
    if (job) {
        context += `\n\n関連案件: ${job.title}`;
        context += `\n案件詳細: ${job.details}`;
        context += `\n案件価格: ${job.price.toLocaleString()}円`;
        context += `\n変動費: ${job.variableCost.toLocaleString()}円`;
    }
    if (estimate) {
        context += `\n\n関連見積: ${estimate.title}`;
        context += `\n見積合計金額: ${estimate.grandTotal.toLocaleString()}円`;
        context += `\n見積詳細:\n`;
        estimate.items.forEach(item => {
            context += `- ${item.name} 数量: ${item.qty} 単価: ${item.unitPrice}円\n`;
        });
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: context,
        config: {
            temperature: 0.7,
            topP: 0.95,
            topK: 64,
        },
    });
    return response.text;
}


// --- Estimate Related AI Functions ---
export async function createDraftEstimate(prompt: string, files: { data: string, mimeType: string }[]): Promise<EstimateDraft> {
    const ai = getGenAI();
    
    const parts: any[] = [{ text: `以下の情報とファイルから、見積書の下書きを作成してください。
    - 顧客の候補 (会社名、担当者名、連絡先など)
    - 件名の候補
    - 支払条件、納期、配送方法の候補
    - 項目ごとの明細 (品名、数量、単位、単価)
    - 備考
    
    JSON形式で出力してください。不明な項目はnullにしてください。
    
    入力内容: "${prompt}"` }];

    files.forEach(file => {
        parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
    });

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro", // Handles text and images/PDFs
        contents: { parts: parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sourceSummary: { type: Type.STRING, nullable: true },
                    customerCandidates: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                company: { type: Type.STRING, nullable: true },
                                person: { type: Type.STRING, nullable: true },
                                email: { type: Type.STRING, nullable: true },
                                tel: { type: Type.STRING, nullable: true },
                            },
                        },
                        nullable: true,
                    },
                    subjectCandidates: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                    paymentTerms: { type: Type.STRING, nullable: true },
                    deliveryTerms: { type: Type.STRING, nullable: true },
                    deliveryMethod: { type: Type.STRING, nullable: true },
                    currency: { type: Type.STRING, enum: ['JPY'], default: 'JPY' },
                    taxInclusive: { type: Type.BOOLEAN, nullable: true },
                    dueDate: { type: Type.STRING, format: "date", nullable: true },
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING, nullable: true },
                                qty: { type: Type.NUMBER },
                                unit: { type: Type.STRING, nullable: true },
                                unitPrice: { type: Type.NUMBER },
                            },
                            required: ["name", "qty", "unitPrice"]
                        },
                        nullable: true,
                    },
                    notes: { type: Type.STRING, nullable: true },
                },
                required: ["customerCandidates", "subjectCandidates", "items"] // Ensure essential fields are always there
            },
            thinkingConfig: { thinkingBudget: 32768 },
        },
    });
    const text = response.text.trim().replace(/^```json\n|\n```$/g, '');
    return JSON.parse(text);
}

export async function parseLineItems(prompt: string): Promise<EstimateLineItem[]> {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `以下のテキストから見積もり明細の項目を抽出してください。
        例: "A4チラシ1000枚、両面カラー、コート紙90kg、1枚あたり100円。ポスターB2サイズ50部、片面、1部500円"
        -> [ {"name": "A4チラシ", "description": "両面カラー、コート紙90kg", "qty": 1000, "unit": "枚", "unitPrice": 100}, {"name": "ポスター", "description": "B2サイズ、片面", "qty": 50, "unit": "部", "unitPrice": 500} ]
        
        抽出するテキスト: "${prompt}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING, nullable: true },
                        qty: { type: Type.NUMBER },
                        unit: { type: Type.STRING, nullable: true },
                        unitPrice: { type: Type.NUMBER },
                    },
                    required: ["name", "qty", "unitPrice"]
                },
            },
        },
    });
    const text = response.text.trim().replace(/^```json\n|\n```$/g, '');
    return JSON.parse(text);
}


// --- Period Closing Related AI Functions ---
export async function generateClosingSummary(
    periodType: '月次' | '年次',
    currentPeriodJobs: Job[],
    prevPeriodJobs: Job[],
    currentPeriodJournal: JournalEntry[],
    prevPeriodJournal: JournalEntry[],
): Promise<string> {
    const ai = getGenAI();
    
    // Summarize data for AI
    const summarizeJobs = (jobs: Job[]) => {
        const totalSales = jobs.reduce((sum, j) => sum + j.price, 0);
        const totalVariableCost = jobs.reduce((sum, j) => sum + j.variableCost, 0);
        return { totalSales, totalVariableCost, totalMargin: totalSales - totalVariableCost, jobCount: jobs.length };
    };

    const summarizeJournal = (entries: JournalEntry[]) => {
        const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
        const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
        return { totalDebit, totalCredit };
    };

    const currentSummary = summarizeJobs(currentPeriodJobs);
    const prevSummary = summarizeJobs(prevPeriodJobs);
    const currentJournalSummary = summarizeJournal(currentPeriodJournal);
    const prevJournalSummary = summarizeJournal(prevPeriodJournal);

    const prompt = `以下の${periodType}の期間データに基づいて、決算のサマリーを作成してください。
    主な焦点は、売上、利益、コストの動向、そして前期間との比較です。
    特に、目立った変動や注目すべき点を強調してください。

    --- 今期間のデータ ---
    案件数: ${currentSummary.jobCount}
    売上合計: ${currentSummary.totalSales.toLocaleString()}円
    変動費合計: ${currentSummary.totalVariableCost.toLocaleString()}円
    限界利益合計: ${currentSummary.totalMargin.toLocaleString()}円
    仕訳借方合計: ${currentJournalSummary.totalDebit.toLocaleString()}円
    仕訳貸方合計: ${currentJournalSummary.totalCredit.toLocaleString()}円

    --- 前期間のデータ ---
    案件数: ${prevSummary.jobCount}
    売上合計: ${prevSummary.totalSales.toLocaleString()}円
    変動費合計: ${prevSummary.totalVariableCost.toLocaleString()}円
    限界利益合計: ${prevSummary.totalMargin.toLocaleString()}円
    仕訳借方合計: ${prevJournalSummary.totalDebit.toLocaleString()}円
    仕訳貸方合計: ${prevJournalSummary.totalCredit.toLocaleString()}円

    サマリーは簡潔かつ専門的に、ビジネス上の洞察を含めて記述してください。`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro", // Complex text task
        contents: prompt,
        config: {
            temperature: 0.7,
            topP: 0.95,
            topK: 64,
        },
    });
    return response.text;
}


// --- Lead Related AI Functions ---
export async function investigateLeadCompany(companyName: string): Promise<CompanyInvestigation> {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: `"${companyName}" という会社についてWebから調査し、以下の項目でレポートを作成してください。
        - 簡潔なサマリー: 会社概要、事業内容、最近のニュースや動向。
        - 情報源: 調査に用いたWebサイトのURLとそのタイトル。
        
        JSON形式で出力してください。
        JSON例:
        {
          "summary": "〇〇株式会社は...",
          "sources": [{"uri": "https://example.com", "title": "Example.com"}]
        }`,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    sources: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                uri: { type: Type.STRING },
                                title: { type: Type.STRING, nullable: true },
                            },
                        },
                    },
                },
                required: ["summary", "sources"]
            },
        },
    });
    const text = response.text.trim().replace(/^```json\n|\n```$/g, '');
    const result = JSON.parse(text);
    result.sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean) || [];
    return result;
}

export async function createLeadProposalPackage(lead: Lead): Promise<LeadProposalPackage> {
    const ai = getGenAI();

    const prompt = `以下のリード情報から、このリードが「営業リード（商談化の可能性があるリード）」であるかどうかを判断してください。
    「営業リード」であると判断した場合、isSalesLeadをtrueにし、以下の提案書パッケージをJSON形式で作成してください。
    「営業リード」ではないと判断した場合、isSalesLeadをfalseにし、その理由をreasonに記述してください。

    リード情報:
    会社名: ${lead.company}
    担当者名: ${lead.name}
    メール: ${lead.email || 'なし'}
    電話: ${lead.phone || 'なし'}
    お問い合わせ種別: ${lead.inquiryTypes?.join(', ') || lead.inquiryType || '不明'}
    メッセージ: ${lead.message || 'なし'}
    営業活動情報: ${lead.infoSalesActivity || 'なし'}

    提案書パッケージ (isSalesLead: trueの場合):
    - reason: なぜ営業リードであると判断したかの簡潔な理由
    - proposal (CustomProposalContent型):
      - coverTitle: 提案書のタイトル
      - businessUnderstanding: 相手の事業理解
      - challenges: 相手の課題
      - proposal: 弊社からの具体的な提案内容
      - conclusion: 結論
    - estimate (EstimateLineItem型として、以下の項目を定義):
      - name: 品名
      - qty: 数量
      - unit: 単位
      - unitPrice: 単価
      - description: 区分や詳細説明 (例: 印刷費, デザイン費)

    JSON形式で出力してください。`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    isSalesLead: { type: Type.BOOLEAN },
                    reason: { type: Type.STRING },
                    proposal: {
                        type: Type.OBJECT,
                        properties: {
                            coverTitle: { type: Type.STRING, nullable: true },
                            businessUnderstanding: { type: Type.STRING, nullable: true },
                            challenges: { type: Type.STRING, nullable: true },
                            proposal: { type: Type.STRING, nullable: true },
                            conclusion: { type: Type.STRING, nullable: true },
                        },
                        nullable: true,
                    },
                    estimate: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING }, // Mapped from 'content'
                                qty: { type: Type.NUMBER }, // Mapped from 'quantity'
                                unit: { type: Type.STRING, nullable: true },
                                unitPrice: { type: Type.NUMBER },
                                description: { type: Type.STRING, nullable: true }, // Mapped from 'division'
                            },
                            required: ["name", "qty", "unitPrice"]
                        },
                        nullable: true,
                    },
                },
                required: ["isSalesLead", "reason"]
            },
        },
    });
    const text = response.text.trim().replace(/^```json\n|\n```$/g, '');
    return JSON.parse(text);
}


export async function generateLeadReplyEmail(lead: Lead): Promise<GeneratedEmailContent> {
    const ai = getGenAI();
    const prompt = `以下のリード情報に基づいて、問い合わせに対する返信メールの件名と本文を作成してください。
    - 会社名: ${lead.company}
    - 担当者名: ${lead.name}
    - 問い合わせ種別: ${lead.inquiryTypes?.join(', ') || lead.inquiryType || '不明'}
    - メッセージ: ${lead.message || 'なし'}
    
    メールは丁寧で、顧客の問い合わせ内容に寄り添ったものであること。
    必要に応じて、次のステップを促す内容を含めてください。
    
    JSON形式で出力してください。
    例:
    {
      "subject": "〇〇株式会社様からのお問い合わせについて",
      "bodyText": "本文..."
    }`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    subject: { type: Type.STRING },
                    bodyText: { type: Type.STRING },
                },
                required: ["subject", "bodyText"]
            },
        },
    });
    const text = response.text.trim().replace(/^```json\n|\n```$/g, '');
    return JSON.parse(text);
}


// --- Application Chat AI Functions ---
export async function processApplicationChat(
    history: { role: 'user' | 'model'; content: string }[],
    applicationCodes: ApplicationCode[],
    users: User[],
    approvalRoutes: ApprovalRoute[]
): Promise<string> {
    const ai = getGenAI();

    // Prepare tool information
    const applicationCodeNames = applicationCodes.map(ac => ({ name: ac.name, code: ac.code }));
    const userNames = users.map(u => ({ id: u.id, name: u.name }));
    const routeNames = approvalRoutes.map(ar => ({ id: ar.id, name: ar.name, steps: ar.routeData.steps.map(s => users.find(u => u.id === s.approverId)?.name || '不明なユーザー') }));

    const submitApplicationFunction: FunctionDeclaration = {
        name: 'submitApplication',
        description: '申請をシステムに提出する。',
        parameters: {
            type: Type.OBJECT,
            properties: {
                applicationCodeId: {
                    type: Type.STRING,
                    description: `申請種別のID。以下のリストから選択: ${JSON.stringify(applicationCodeNames)}`
                },
                formData: {
                    type: Type.OBJECT,
                    description: '申請フォームのデータ。キーと値のペアで構成。例: { "leaveType": "有給休暇", "startDate": "2024-01-01", "endDate": "2024-01-05", "reason": "私用のため" }'
                },
                approvalRouteId: {
                    type: Type.STRING,
                    description: `承認ルートのID。以下のリストから選択: ${JSON.stringify(routeNames)}`
                },
            },
            required: ['applicationCodeId', 'formData', 'approvalRouteId']
        }
    };

    const chat = ai.chats.create({
        model: "gemini-2.5-pro",
        tools: [{ functionDeclarations: [submitApplicationFunction] }],
        config: {
            systemInstruction: `あなたは申請をサポートするAIアシスタントです。
            ユーザーの意図を理解し、必要な情報を質問して、最終的にsubmitApplication関数を呼び出すためのJSONを生成してください。
            提供されたツール (applicationCodes, users, approvalRoutes) の情報を使って、適切なIDを選択し、formDataを構築してください。
            特に指定がない場合は、最新の「社長決裁ルート」を使用してください。
            ユーザーが「経費精算」を申請したいと言った場合、formDataに'departmentId', 'details', 'notes', 'totalAmount'などを含めるように促してください。
            ユーザーが「交通費申請」を申請したいと言った場合、formDataに'details', 'notes', 'totalAmount'などを含めるように促してください。
            ユーザーが「休暇申請」を申請したいと言った場合、formDataに'leaveType', 'startDate', 'endDate', 'reason'などを含めるように促してください。
            ユーザーが「稟議（経費なし決裁）」を申請したいと言った場合、formDataに'title', 'details'などを含めるように促してください。
            ユーザーが「日報」を申請したいと言った場合、formDataに'reportDate', 'startTime', 'endTime', 'customerName', 'activityContent', 'nextDayPlan'などを含めるように促してください。
            ユーザーが「週報」を申請したいと言った場合、formDataに'title', 'details'などを含めるように促してください。
            最終的にすべての情報が揃ったら、ツールを呼び出すためのJSONのみを出力してください。会話形式の応答は不要です。`,
        },
    });

    const response = await chat.sendMessage(history);
    
    if (response.functionCalls && response.functionCalls.length > 0) {
        // Return the JSON for the function call
        return JSON.stringify(response.functionCalls[0]);
    } else {
        // Return text response
        return response.text;
    }
}

// --- Report Related AI Functions ---
export async function generateDailyReportSummary(customerName: string, activityContent: string): Promise<string> {
    const ai = getGenAI();
    const prompt = `以下の顧客名と活動内容に基づいて、日報の活動内容セクションをより詳細かつ構造的に記述してください。
    顧客名: ${customerName || 'なし'}
    活動内容のキーワードや簡単な説明: ${activityContent}
    
    記述は簡潔で、箇条書きなどを活用して読みやすくしてください。
    営業活動であれば、顧客との商談内容、進捗、次回のネクストアクションなどを具体的に含めてください。
    開発活動であれば、タスクの進捗、発生した課題、解決策などを具体的に含めてください。`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            temperature: 0.7,
            topP: 0.95,
            topK: 64,
        },
    });
    return response.text;
}

export async function generateWeeklyReportSummary(details: string): Promise<string> {
    const ai = getGenAI();
    const prompt = `以下のキーワードや内容から、週報の報告内容セクションをより包括的かつ分析的に記述してください。
    キーワードや簡単な説明: ${details}
    
    記述は簡潔で、以下の要素を含めてください。
    - 今週の主要な業務と成果
    - 発生した課題と対応
    - 来週の計画と目標
    - 全体的な所感や改善提案`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            temperature: 0.7,
            topP: 0.95,
            topK: 64,
        },
    });
    return response.text;
}

export async function parseApprovalDocument(base64File: string, mimeType: string): Promise<{ title: string; details: string }> {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64File,
                    },
                },
                {
                    text: `以下のファイルの内容から、稟議書の「件名」と「目的・概要」を抽出してください。
                    JSON形式で出力してください。
                    例:
                    {
                      "title": "新規取引先との契約締結について",
                      "details": "〇〇株式会社との新規契約の目的、背景、具体的な取引条件について。"
                    }`
                },
            ],
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    details: { type: Type.STRING },
                },
                required: ["title", "details"]
            },
        },
    });
    const text = response.text.trim().replace(/^```json\n|\n```$/g, '');
    return JSON.parse(text);
}


// --- Bug Report AI Functions ---
export function startBugReportChat(): Chat {
    const ai = getGenAI();
    const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        tools: [{
            functionDeclarations: [
                {
                    name: "submitBugReport",
                    description: "ユーザーからのバグ報告や改善要望をシステムに提出する。",
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            report_type: {
                                type: Type.STRING,
                                enum: ["bug", "improvement"],
                                description: "報告の種類 (バグ報告または改善要望)",
                            },
                            summary: {
                                type: Type.STRING,
                                description: "報告の簡潔な要約",
                            },
                            description: {
                                type: Type.STRING,
                                description: "問題の詳細な説明または改善の提案内容",
                            },
                        },
                        required: ["report_type", "summary", "description"],
                    },
                },
            ],
        }],
        config: {
            systemInstruction: `あなたはユーザーからのバグ報告や改善要望を受け付け、submitBugReport関数を呼び出すためのJSONを生成するアシスタントです。
            ユーザーから問題や要望を聞き出し、以下の情報を収集してください:
            1. 報告の種類 (バグ報告 'bug' または改善要望 'improvement')
            2. 簡潔な要約 (summary)
            3. 詳細な説明 (description)
            
            情報が揃ったら、submitBugReport関数を呼び出すためのJSONを直接出力してください。会話形式の応答は不要です。
            例: {"report_type": "bug", "summary": "ログインボタンが機能しない", "description": "ログインページでログインボタンをクリックしても反応がなく、エラーメッセージも表示されません。"}`,
        },
    });
    return chat;
}


// --- Market Research AI Functions ---
export async function generateMarketResearchReport(topic: string): Promise<MarketResearchReport> {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: `以下のトピックに関する市場調査レポートをJSON形式で作成してください。
        レポートには以下のセクションを含めてください。
        - title: レポートのタイトル
        - summary: 市場の全体像と主要な調査結果の要約。
        - trends: 主要な市場トレンドと成長要因を箇条書きで。
        - competitorAnalysis: 主要な競合他社の分析と市場でのポジショニング。
        - opportunities: 新しいビジネスチャンスや未開拓の市場領域を箇条書きで。
        - threats: 市場における潜在的な脅威やリスクを箇条書きで。
        - sources: 調査に用いたWebサイトのURLとそのタイトル。
        
        トピック: "${topic}"`,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    trends: { type: Type.ARRAY, items: { type: Type.STRING } },
                    competitorAnalysis: { type: Type.STRING },
                    opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                    threats: { type: Type.ARRAY, items: { type: Type.STRING } },
                    sources: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                uri: { type: Type.STRING },
                                title: { type: Type.STRING, nullable: true },
                            },
                        },
                        nullable: true,
                    },
                },
                required: ["title", "summary", "trends", "competitorAnalysis", "opportunities", "threats"]
            },
        },
    });
    const text = response.text.trim().replace(/^```json\n|\n```$/g, '');
    const result = JSON.parse(text);
    result.sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean) || [];
    return result;
}


// --- Live Chat AI Functions ---
// Export helper functions for audio encoding/decoding as they are defined in guidelines
export function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

export function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    // Convert Uint8Array buffer to base64 string
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return {
        data: btoa(binary),
        mimeType: 'audio/pcm;rate=16000',
    };
}


interface LiveChatCallbacks {
    onTranscription: (type: 'input' | 'output', text: string) => void;
    onAudioChunk: (base64Audio: string) => Promise<void>;
    onTurnComplete: () => void;
    onError: (event: ErrorEvent) => void;
    onClose: (event: CloseEvent) => void;
    onInterrupted: () => void;
}

export async function startLiveChatSession(callbacks: LiveChatCallbacks): Promise<Chat> {
    const ai = getGenAI();
    const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {
                console.debug('Live session opened.');
            },
            onmessage: async (message: LiveServerMessage) => {
                if (message.serverContent?.outputTranscription) {
                    callbacks.onTranscription('output', message.serverContent.outputTranscription.text);
                }
                if (message.serverContent?.inputTranscription) {
                    callbacks.onTranscription('input', message.serverContent.inputTranscription.text);
                }
                if (message.serverContent?.turnComplete) {
                    callbacks.onTurnComplete();
                }
                if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                    await callbacks.onAudioChunk(message.serverContent.modelTurn.parts[0].inlineData.data);
                }
                if (message.serverContent?.interrupted) {
                    callbacks.onInterrupted();
                }
            },
            onerror: callbacks.onError,
            onclose: callbacks.onClose,
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            systemInstruction: 'あなたは丁寧で親切なAIアシスタントです。ユーザーの質問に簡潔に答えてください。',
        },
    });
    return session;
}

// FIX: Add startBusinessConsultantChat to `geminiService.ts`
export function startBusinessConsultantChat(): Chat {
    const ai = getGenAI();
    const chat = ai.chats.create({
        model: "gemini-2.5-pro", // Complex text tasks
        config: {
            tools: [{ googleSearch: {} }], // Use Google Search for grounding
            systemInstruction: `あなたは会社の経営相談AIアシスタントです。提供されたデータコンテキストとWeb上の情報に基づいて、経営に関する質問に詳細かつ的確に答えてください。
            売上向上の戦略、コスト削減のアイデア、市場トレンド分析など、ビジネス上の洞察を提供してください。
            質問に関連する情報源があれば、必ずURLを提示してください。`,
        },
    });
    return chat;
}


// --- Project Creation AI Functions ---
export async function createProjectFromInputs(inputText: string, files: { name: string, data: string, mimeType: string }[]): Promise<{ projectName: string; customerName: string; overview: string; extracted_details: string; file_categorization: { fileName: string; category: string }[]; }> {
    const ai = getGenAI();

    const parts: any[] = [{ text: `以下のテキストと添付ファイルから、新規案件の情報を抽出・生成してください。
    - 案件名 (projectName)
    - 顧客名 (customerName)
    - 案件の概要 (overview): 顧客の要望、目的、背景などをまとめたもの。
    - 抽出された詳細情報 (extracted_details): テキストやファイルから読み取れた具体的な仕様、数値、期限など。箇条書きで構造化してください。
    - 添付ファイルのカテゴリ分類 (file_categorization): 各ファイルを「仕様書」「デザイン」「ロゴ」「その他」などのカテゴリに分類してください。

    JSON形式で出力してください。

    入力テキスト: "${inputText}"
    
    ` }];

    files.forEach(file => {
        parts.push({
            inlineData: {
                mimeType: file.mimeType,
                data: file.data
            },
            text: `ファイル名: ${file.name}` // Add filename for context
        });
    });

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: { parts: parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    projectName: { type: Type.STRING },
                    customerName: { type: Type.STRING },
                    overview: { type: Type.STRING },
                    extracted_details: { type: Type.STRING },
                    file_categorization: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                fileName: { type: Type.STRING },
                                category: { type: Type.STRING, enum: ["仕様書", "デザイン", "ロゴ", "その他"] }
                            },
                            required: ["fileName", "category"]
                        }
                    }
                },
                required: ["projectName", "customerName", "overview", "extracted_details", "file_categorization"]
            },
            thinkingConfig: { thinkingBudget: 32768 },
        },
    });
    const text = response.text.trim().replace(/^```json\n|\n```$/g, '');
    return JSON.parse(text);
}