export type ContentStatus = '起草' | '待核对' | '已核对';
export type ModuleStatus = '骨架' | '起草' | '已核对';

export interface TimelineEvent {
  事件: string;
  模块: string;
  参数?: Record<string, unknown>;
  说明?: string; // optional AI-generated explanation
}

export interface VerticalLayers {
  天上: string[];
  地面: string[];
  地下: string[];
}

export interface LocationScript {
  地点ID: string;
  名称: string;
  坐标: [number, number];
  区位: string;
  类型标签: string[];
  一句话: string;
  形成时间线: TimelineEvent[];
  垂直拆解: VerticalLayers;
  本地注解: string;
  事实来源: string[];
  状态: ContentStatus;
}

export interface ProcessModule {
  模块ID: string;
  一句话: string;
  原理讲解?: string;
  剖面画法?: string;
  动画脚本?: string;
  参数槽?: string[];
  子模块?: string[];
  易错警示?: string;
  事实来源?: string[];
  状态: ModuleStatus;
  rawMarkdown: string;
}

/** AI-generated card: same shape as LocationScript, distinguished by _source */
export interface AILocationCard extends LocationScript {
  readonly _source: 'ai';
}

export type AnyCard = LocationScript | AILocationCard;

export function isAICard(card: AnyCard): card is AILocationCard {
  return (card as AILocationCard)._source === 'ai';
}

/** 地点ID → 该地点引用的所有过程模块ID列表 */
export interface LocationModuleIndex {
  [locationId: string]: string[];
}
