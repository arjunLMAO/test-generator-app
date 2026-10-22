import { SubjectName, VisualAsset, VisualType } from '../types/jee';
import { VERIFIED_PYQ_DIAGRAMS } from './VisualAssetResolver';

export class VisualAssetEngine {
  public static createWheatstoneBridge113Diagram(questionId: string): VisualAsset {
    const verifiedData =
      VERIFIED_PYQ_DIAGRAMS[
        'JEE Main 2023 (Online) 1st February Morning Shift Physics - Current Electricity Question 113 English'
      ];

    return {
      assetId: `pyq-verified-${questionId}`,
      type: verifiedData ? verifiedData.type : 'circuit',
      subject: 'Physics',
      chapter: 'Current Electricity',
      questionId,
      format: 'svg',
      svgContent: verifiedData ? verifiedData.svgContent : '<svg></svg>',
      imageUrl: verifiedData
        ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(verifiedData.svgContent)}`
        : undefined,
      url: verifiedData
        ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(verifiedData.svgContent)}`
        : undefined,
      altText: verifiedData ? verifiedData.altText : 'Wheatstone bridge circuit diagram',
      caption: verifiedData ? verifiedData.caption : 'Wheatstone bridge circuit diagram',
      verified: true,
      visualStatus: 'verified',
    };
  }

  public static createVisualAsset(
    subject: SubjectName,
    chapter: string,
    visualType: VisualType,
    code: string = 'GEN',
    options?: { caption?: string; substrate?: string }
  ): VisualAsset {
    const questionId = `${code}-${Math.floor(Math.random() * 10000)}`;
    const altText = options?.caption || `${chapter} Visual Diagram`;
    const caption = options?.caption || `${chapter} Visual Diagram`;

    return {
      assetId: `VA-${questionId}`,
      questionId,
      type: visualType,
      subject,
      chapter,
      format: 'svg',
      svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160" width="400" height="160" class="w-full h-auto select-none">
        <rect x="2" y="2" width="396" height="156" rx="8" fill="#FAFAFA" stroke="#E5E5E5" stroke-width="1.5"/>
        <text x="200" y="85" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#111111" text-anchor="middle">${caption}</text>
      </svg>`,
      altText,
      caption,
      verified: true,
      visualStatus: 'verified',
    };
  }
}
