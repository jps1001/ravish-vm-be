import { Request } from 'express';
import { PaginationOptions } from 'mongoose-paginate-ts';

interface PaginationOptionsExtras {
  allowedQueryFields?: string[];
  predefinedAggregates?: Record<string, any[]>;
  mode?: 'single' | 'list';
}

// export function buildPaginationOptions(
//   req: Request,
//   config: PaginationOptionsExtras = {}
// ): PaginationOptions {
//   const mode = config.mode || 'list';
//   const options: PaginationOptions = {};
//
//   // 🧭 Shared Options
//   if (req.query.select) {
//     options.select = req.query.select as string;
//   }
//
//   if (req.query.populate) {
//     if (Array.isArray(req.query.populate)) {
//       options.populate = req.query.populate.join(' ');
//     } else if (typeof req.query.populate === 'string') {
//       options.populate = req.query.populate.split(',').join(' ');
//     }
//   }
//
//   if (req.query.projection) {
//     options.projection = req.query.projection as string;
//   }
//
//
//   if (req.query.lean) {
//     options.lean = req.query.lean === 'true';
//   }
//
//   if (req.query.key) {
//     options.key = req.query.key as string;
//   }
//
//   // 📄 List-specific Pagination Fields
//   if (mode === 'list') {
//     if (req.query.page) {
//       options.page = parseInt(req.query.page as string, 10);
//     }
//
//     if (req.query.limit) {
//       options.limit = parseInt(req.query.limit as string, 10);
//     }
//
//     if (req.query.sort) {
//       options.sort = req.query.sort as string;
//     }
//
//     if (req.query.startingAfter) {
//       options.startingAfter = req.query.startingAfter;
//     }
//
//     if (req.query.endingBefore) {
//       options.endingBefore = req.query.endingBefore;
//     }
//   }
//
//   // 🔐 Safe Query Filtering — allowed in both modes
//   // if (config.allowedQueryFields && req.query.query) {
//   //   try {
//   //     const parsedQuery = JSON.parse(req.query.query as string);
//   //     options.query = Object.fromEntries(
//   //       Object.entries(parsedQuery).filter(([key]) =>
//   //         config.allowedQueryFields!.includes(key)
//   //       )
//   //     );
//   //   } catch {
//   //     throw new Error('Invalid query JSON string');
//   //   }
//   // }
//   if (config.allowedQueryFields && req.query.query) {
//     try {
//       const parsedQuery = JSON.parse(req.query.query as string);
//
//       // Recursively flatten nested query object to dot notation
//       const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
//         return Object.entries(obj).reduce((acc, [key, value]) => {
//           const newKey = prefix ? `${prefix}.${key}` : key;
//
//           if (
//             typeof value === 'object' &&
//             value !== null &&
//             !Array.isArray(value) &&
//             !Object.keys(value).some(k => k.startsWith('$'))
//           ) {
//             Object.assign(acc, flattenObject(value, newKey));
//           } else {
//             acc[newKey] = value;
//           }
//
//           return acc;
//         }, {} as Record<string, any>);
//       };
//
//       const flatQuery = flattenObject(parsedQuery);
//
//       const filteredQuery = Object.fromEntries(
//         Object.entries(flatQuery).filter(([key]) =>
//           config.allowedQueryFields!.some(allowed =>
//             key === allowed || key.startsWith(`${allowed}.`)
//           )
//         )
//       );
//
//       // Convert flat back to nested object (optional, but helps with mongoose)
//       const unflattenObject = (flatObj: Record<string, any>) => {
//         const result: any = {};
//         for (const [key, value] of Object.entries(flatObj)) {
//           const keys = key.split('.');
//           keys.reduce((acc, curr, i) => {
//             if (i === keys.length - 1) {
//               acc[curr] = value;
//             } else {
//               acc[curr] = acc[curr] || {};
//             }
//             return acc[curr];
//           }, result);
//         }
//         return result;
//       };
//
//       options.query = unflattenObject(filteredQuery);
//
//       // console.log(options.query);
//
//     } catch (err) {
//       throw new Error('Invalid query JSON string');
//     }
//   }
//
//
//   // 🔐 Safe Aggregation — MULTIPLE aggregates
//   // if (config.predefinedAggregates && req.query.aggregate) {
//   //   const requested = req.query.aggregate as string | string[] | undefined;
//   //   const keys = Array.isArray(requested)
//   //     ? requested
//   //     : (requested as string).split(",");
//   //
//   //   const validPipelines = keys.flatMap(key => {
//   //     if (!config.predefinedAggregates![key]) {
//   //       throw new Error(`Invalid aggregate: ${key}`);
//   //     }
//   //     return config.predefinedAggregates![key];
//   //   });
//   //
//   //   options.aggregate = validPipelines;
//   // }
//   //
//   //
//   let searchMatch: any = null;
//
//   console.log("Search Query: ", req.query.search);
//
//   if (req.query.search) {
//     try {
//       const parsedSearch = JSON.parse(req.query.search as any);
//
//       if (typeof parsedSearch !== 'object' || Array.isArray(parsedSearch)) {
//         throw new Error('Search must be a JSON object');
//       }
//
//       const orConditions = Object.entries(parsedSearch).map(([field, value]) => ({
//         [field]: { $regex: value, $options: 'i' } // case-insensitive
//       }));
//
//       if (orConditions.length) {
//         searchMatch = { $match: { $or: orConditions } };
//       }
//     } catch {
//       throw new Error('Invalid search JSON string');
//     }
//   }
//   // 🔐 Safe Aggregation — MULTIPLE aggregates
//   if (config.predefinedAggregates && req.query.aggregate) {
//     const requested = req.query.aggregate as string | string[] | undefined;
//     const keys = Array.isArray(requested)
//       ? requested
//       : (requested as string).split(",");
//
//     const validPipelines = keys.flatMap(key => {
//       if (!config.predefinedAggregates![key]) {
//         throw new Error(`Invalid aggregate: ${key}`);
//       }
//       return config.predefinedAggregates![key];
//     });
//
//     if (searchMatch) {
//       validPipelines.unshift(searchMatch);
//     }
//
//     if (options.query) {
//       validPipelines.unshift({ $match: options.query });
//       delete options.query; // ✅ Safe here because we're in aggregation mode
//     }
//
//     options.aggregate = validPipelines;
//   } else if (searchMatch) {
//     // 👇 Do NOT override options.query — merge if it exists
//     if (options.query) {
//       options.query = {
//         $and: [
//           options.query,
//           { $or: searchMatch.$match.$or }
//         ]
//       };
//     } else {
//       options.query = { $or: searchMatch.$match.$or };
//     }
//   }
//
//   console.log(options);
//
//   return options;
// }
export function buildPaginationOptions(
  req: Request,
  config: PaginationOptionsExtras = {}
): PaginationOptions {
  const mode = config.mode || 'list';
  const options: PaginationOptions = {};

  // 🧭 Shared Options
  if (req.query.select) {
    options.select = req.query.select as string;
  }

  if (req.query.populate) {
    if (Array.isArray(req.query.populate)) {
      options.populate = req.query.populate.join(' ');
    } else if (typeof req.query.populate === 'string') {
      options.populate = req.query.populate.split(',').join(' ');
    }
  }

  if (req.query.projection) {
    options.projection = req.query.projection as string;
  }

  if (req.query.lean) {
    options.lean = req.query.lean === 'true';
  }

  if (req.query.key) {
    options.key = req.query.key as string;
  }

  // 📄 List-specific Pagination Fields
  if (mode === 'list') {
    if (req.query.page) {
      options.page = parseInt(req.query.page as string, 10);
    }

    if (req.query.limit) {
      options.limit = parseInt(req.query.limit as string, 10);
    }

    if (req.query.sort) {
      options.sort = req.query.sort as string;
    }

    if (req.query.startingAfter) {
      options.startingAfter = req.query.startingAfter;
    }

    if (req.query.endingBefore) {
      options.endingBefore = req.query.endingBefore;
    }
  }

  // 🔐 Safe Aggregation — MULTIPLE aggregates with dynamic parameters
  let searchMatch: any = null;

  if (req.query.search) {
    try {
      const parsedSearch = JSON.parse(req.query.search as any);

      if (typeof parsedSearch !== 'object' || Array.isArray(parsedSearch)) {
        throw new Error('Search must be a JSON object');
      }

      const orConditions = Object.entries(parsedSearch).map(([field, value]) => ({
        [field]: { $regex: value, $options: 'i' } // case-insensitive
      }));

      if (orConditions.length) {
        searchMatch = { $match: { $or: orConditions } };
      }
    } catch {
      throw new Error('Invalid search JSON string');
    }
  }


  // 🔐 Safe Aggregation — MULTIPLE aggregates with dynamic parameters
  if (config.predefinedAggregates && req.query.aggregate) {
    const requested = req.query.aggregate as string | string[] | undefined;
    const keys = Array.isArray(requested)
      ? requested
      : (requested as string).split(",");


    const validPipelines = keys.flatMap(key => {
      if (!config.predefinedAggregates![key]) {
        throw new Error(`Invalid aggregate: ${key}`);
      }

      const aggregatePipeline = config.predefinedAggregates![key];

      if (req.query[key]) {
        const params = req.query[key];

        return aggregatePipeline.map(stage => {
          let stageStr = JSON.stringify(stage);

          Object.entries(params).forEach(([paramKey, paramValue]) => {
            if (!paramValue) throw new Error(`Missing parameter: ${paramKey}`);

            // Escape special regex characters in parameter key
            const escapedKey = paramKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Replace without adding quotes
            stageStr = stageStr.replace(
              new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g'),
              paramValue as string,
            );
          });

          // Verify valid JSON before parsing
          try {
            return JSON.parse(stageStr, (key, value) => {
              if ((key === '$gte' || key === '$lte') && typeof value === 'string') {
                const date = new Date(value);
                if (isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
                return date;
              }
              return value;
            });
          } catch (e) {
            throw new Error(`Invalid JSON after replacement: ${stageStr}`);
          }
        });
      }

      return aggregatePipeline;
    });

    if (searchMatch) {
      validPipelines.unshift(searchMatch);
    }

    if (options.query) {
      validPipelines.unshift({ $match: options.query });
      delete options.query; // ✅ Safe here because we're in aggregation mode
    }

    options.aggregate = validPipelines;
  } else if (searchMatch) {
    if (options.query) {
      options.query = {
        $and: [
          options.query,
          { $or: searchMatch.$match.$or }
        ]
      };
    } else {
      options.query = { $or: searchMatch.$match.$or };
    }
  }

  return options;
}


