export const vehicleQueries = ["vendorId", "warehouseId", "vendorId._id", "warehouseId._id"];



const withDowntimeStatus = [
  {
    $lookup: {
      from: "downtimes",
      let: { vehicleId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ["$vehicleId", "$$vehicleId"] },
            endTime: { $exists: false }
          }
        },
        { $sort: { startTime: -1 } },
        { $limit: 1 }
      ],
      as: "latestDowntime"
    }
  },
  {
    $unwind: {
      path: "$latestDowntime",
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $addFields: {
      isActive: {
        $cond: {
          if: { $not: ["$latestDowntime"] },
          then: true,
          else: false
        }
      },
    }
  }
]


const withLatestDriver = [
  {
    $lookup: {
      from: "ridehistories",
      let: { vehicleId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ["$vehicleId", "$$vehicleId"] },
            endTime: { $exists: false }
          }
        },
        { $sort: { startTime: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: "drivers",
            localField: "driverId",
            foreignField: "_id",
            as: "driver"
          }
        },
        { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } }
      ],
      as: "latestRide"
    }
  },
  { $unwind: { path: "$latestRide", preserveNullAndEmptyArrays: true } },
  { $addFields: { latestDriver: "$latestRide.driver" } },
  { $project: { latestRide: 0, vendor: 0 } },
]

export const vehicleAggregates = {
  withVendor: [
    {
      $lookup: {
        from: "vendors", // Assuming the collection name is "vendors"
        localField: "vendorId",
        foreignField: "_id",
        as: "vendor"
      }
    },
    { $unwind: { path: "$vendorId", preserveNullAndEmptyArrays: true } },
    { $project: { vendorId: 0 } },
    { $addFields: { vendorId: { $arrayElemAt: ["$vendor", 0] } } },
    { $project: { vendor: 0 } },
  ],
  withWarehouse: [
    {
      $lookup: {
        from: "warehouses", // Assuming the collection name is "warehouses"
        localField: "warehouseId",
        foreignField: "_id",
        as: "warehouse"
      }
    },
    { $unwind: { path: "$warehouseId", preserveNullAndEmptyArrays: true } },
    { $project: { warehouseId: 0 } },
    { $addFields: { warehouseId: { $arrayElemAt: ["$warehouse", 0] } } },
    { $project: { warehouse: 0 } },
  ],
  withLatestDriver,

  withDowntimeStatus,

  onlyActive: [
    ...withDowntimeStatus,
    { $match: { isActive: true } }
  ],

  onlyInactive: [
    ...withDowntimeStatus,
    { $match: { isActive: false } }
  ],

  withDriver: [
    ...withLatestDriver,
    { $match: { latestDriver: { $ne: null } } }
  ],

  withoutDriver: [
    ...withLatestDriver,
    { $match: { latestDriver: null } }
  ],
  countOverTime: [
    {
      $match: {
        updatedAt: {
          $gte: "{{start}}",
          $lte: "{{end}}",
        },
      },
    },
    ...withDowntimeStatus,
    ...withLatestDriver,
    {
      $set: {
        day: {
          $dateTrunc: {
            date: "$updatedAt",
            unit: "day",
          },
        },
        isActive: {
          $cond: {
            if: { $eq: ["$isActive", true] },
            then: 1,
            else: 0,
          },
        },
        isInactive: {
          $cond: {
            if: { $eq: ["$isActive", false] },
            then: 1,
            else: 0,
          },
        },
        hasDriver: {
          $cond: {
            if: { $gt: [{ $type: "$latestDriver" }, "missing"] },
            then: 1,
            else: 0,
          },
        },
        withoutDriver: {
          $cond: {
            if: { $not: [{ $gt: [{ $type: "$latestDriver" }, "missing"] }] },
            then: 1,
            else: 0,
          },
        },

      },
    },
    {
      $group: {
        _id: "$day",
        total: { $sum: 1 },
        active: { $sum: "$isActive" },
        inactive: { $sum: "$isInactive" },
        withDriver: { $sum: "$hasDriver" },
        withoutDriver: { $sum: "$withoutDriver" },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $setWindowFields: {
        sortBy: { _id: 1 },
        output: {
          total: {
            $sum: "$total",
            window: { documents: ["unbounded", "current"] },
          },
          active: {
            $sum: "$active",
            window: { documents: ["unbounded", "current"] },
          },
          inactive: {
            $sum: "$inactive",
            window: { documents: ["unbounded", "current"] },
          },
          withDriver: {
            $sum: "$withDriver",
            window: { documents: ["unbounded", "current"] },
          },
          withoutDriver: {
            $sum: "$withoutDriver",
            window: { documents: ["unbounded", "current"] },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        total: 1,
        active: 1,
        inactive: 1,
        withDriver: 1,
        withoutDriver: 1,
      },
    },
  ],

  vendorCountOverTime: [
    {
      $match: {
        updatedAt: {
          $gte: "{{start}}",
          $lte: "{{end}}",
        },
        vendorId: { $ne: null }  // Only consider vehicles with a vendorId
      }
    },
    {
      $set: {
        day: {
          $dateTrunc: {
            date: "$updatedAt",
            unit: "day"
          }
        }
      }
    },
    {
      $group: {
        _id: { vendorId: "$vendorId", day: "$day" },
        dailyCount: { $sum: 1 }  // Count number of vehicles for each vendor per day
      }
    },
    {
      $lookup: {
        from: "vendors",           // The vendors collection
        localField: "_id.vendorId", // Field from vehicles
        foreignField: "_id",        // Field from vendors
        as: "vendorDetails"         // Alias for the vendor details
      }
    },
    {
      $unwind: "$vendorDetails"
    },
    {
      $set: {
        vendorName: "$vendorDetails.name", // Extract the vendor name
      }
    },
    {
      $group: {
        _id: "$_id.day",  // Group by day
        vendors: {
          $push: {
            k: "$vendorName",       // Use vendor name as the key
            v: { $sum: "$dailyCount" },        // Use daily vehicle count as the value
          }
        },
        totalCount: { $sum: "$dailyCount" }  // Sum of all vehicles across vendors for the day
      }
    },
    {
      $project: {
        _id: 1,
        count: "$totalCount",  // Total vehicle count for the day
        vendors: { $arrayToObject: "$vendors" }  // Convert vendor counts into fields
      }
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            { _id: "$_id", count: "$count" },
            "$vendors",
          ],
        },
      },
    },
    {
      $sort: { _id: 1 }  // Sort by date
    }
  ],


  warehouseCountOverTime: [
    {
      $match: {
        createdAt: {
          $gte: "{{start}}",
          $lte: "{{end}}",
        },
        warehouseId: { $ne: null }  // Only consider vehicles with a warehouseId
      }
    },
    {
      $set: {
        day: {
          $dateTrunc: {
            date: "$createdAt",
            unit: "day"
          }
        }
      }
    },
    {
      $group: {
        _id: { warehouseId: "$warehouseId", day: "$day" },
        dailyCount: { $sum: 1 }  // Count number of vehicles for each warehouse per day
      }
    },
    {
      $lookup: {
        from: "warehouses",           // The warehouses collection
        localField: "_id.warehouseId", // Field from vehicles
        foreignField: "_id",        // Field from warehouses
        as: "warehouseDetails"         // Alias for the warehouse details
      }
    },
    {
      $unwind: "$warehouseDetails"
    },
    {
      $set: {
        warehouseName: "$warehouseDetails.name", // Extract the warehouse name
      }
    },
    {
      $group: {
        _id: "$_id.day",  // Group by day
        warehouses: {
          $push: {
            k: "$warehouseName",       // Use warehouse name as the key
            v: "$dailyCount"        // Use daily vehicle count as the value
          }
        },
        totalCount: { $sum: "$dailyCount" }  // Sum of all vehicles across warehouses for the day
      }
    },
    {
      $project: {
        _id: 1,
        count: "$totalCount",  // Total vehicle count for the day
        warehouses: { $arrayToObject: "$warehouses" }  // Convert warehouse counts into fields
      }
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            { _id: "$_id", count: "$count" },
            "$warehouses",
          ],
        },
      },
    },
    {
      $sort: { _id: 1 }  // Sort by date
    }
  ],
};



