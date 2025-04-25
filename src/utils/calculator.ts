export function calculateClosingAmount(layers: Layer[]): number {
    return layers.reduce((sum, layer) => sum + (layer.qty * layer.rate), 0);
  }
  
  export interface Layer {
    qty: number;
    rate: number;
  }
  