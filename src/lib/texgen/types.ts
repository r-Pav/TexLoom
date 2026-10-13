export type CategoryId =
  | 'basic' | 'order' | 'chaos' | 'wave' | 'glow'
  | 'tile' | 'frame' | 'grad' | 'scatter' | 'kaleido' | 'mask';

export interface CategoryDef {
  id: CategoryId;
  zh: string;
}

export interface ParamDef {
  label: string;
  min: number;
  max: number;
  step: number;
  def: number;
}

export interface PatternDef {
  id: string;
  zh: string;
  cat: CategoryId;
  
  anim?: boolean;
  params: ParamDef[];
  
  glsl: string;
}

export interface GradientStop {
  t: number;
  color: string; 
}
