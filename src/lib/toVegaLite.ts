import { type ChartResult } from '@/types/ChartSpec';

export const toVegaLite = (result: ChartResult) => {
  const { spec, rows } = result;
  
  // Detect if x-axis is temporal (dates)
  const isXTemporal = rows.length > 0 && 
    (typeof rows[0][spec.x] === 'string' && 
     /^\d{4}-\d{2}-\d{2}/.test(rows[0][spec.x]));

  const baseSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: spec.title,
    data: { values: rows },
    width: "container",
    height: 300,
  };

  // Configure encoding based on chart type
  const encoding: any = {
    x: {
      field: spec.x,
      type: isXTemporal ? "temporal" : "nominal",
      title: spec.x
    }
  };

  // Add y encoding for most chart types
  if (spec.chartType !== 'pie' && spec.chartType !== 'table') {
    encoding.y = {
      field: spec.y,
      type: "quantitative",
      title: spec.y
    };

    if (spec.aggregate) {
      encoding.y.aggregate = spec.aggregate;
    }
  }

  // Add series/color encoding if specified
  if (spec.series && spec.chartType !== 'table') {
    encoding.color = {
      field: spec.series,
      type: "nominal",
      title: spec.series
    };
  }

  // Configure mark based on chart type
  let mark: any;
  let vegaSpec: any = { ...baseSpec, encoding };

  switch (spec.chartType) {
    case 'line':
      mark = { type: "line", point: true, tooltip: true };
      break;
    
    case 'bar':
      mark = { type: "bar", tooltip: true };
      break;
    
    case 'stacked_bar':
      mark = { type: "bar", tooltip: true };
      if (spec.series) {
        encoding.color = { field: spec.series, type: "nominal" };
        // Add normalize stack for percentage stacking
        encoding.y = {
          ...encoding.y,
          stack: "normalize"
        };
      }
      break;
    
    case 'area':
      mark = { type: "area", tooltip: true };
      break;
    
    case 'scatter':
      mark = { type: "point", tooltip: true };
      break;
    
    case 'pie':
      vegaSpec = {
        ...baseSpec,
        mark: { type: "arc", tooltip: true },
        encoding: {
          theta: { field: spec.y, type: "quantitative" },
          color: { field: spec.x, type: "nominal" }
        }
      };
      return vegaSpec;
    
    case 'table':
      // For table, we'll return a simple structure
      // The rendering component will handle table display
      return {
        ...baseSpec,
        mark: "text",
        encoding: {
          text: { field: spec.x, type: "nominal" }
        },
        isTable: true
      };
    
    default:
      mark = { type: "bar", tooltip: true };
  }

  vegaSpec.mark = mark;
  return vegaSpec;
};