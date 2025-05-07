export const adminQueries = ["state", "city"]

export const adminAggregates = {
  idAndTypeOnly: [
    {
      $project: {
        _id: 1,
        type: 1
      }
    }
  ],
  countOverTime: [
    {
      $match: {
        createdAt: {
          $gte: "{{start}}",
          $lte: "{{end}}",
        },
      },
    },
    {
      $set: {
        day: {
          $dateTrunc: {
            date: "$createdAt",
            unit: "day",
          },
        },
        isAdmin: { $cond: [{ $eq: ["$type", "admin"] }, 1, 0] },
        isUser: { $cond: [{ $eq: ["$type", "user"] }, 1, 0] },
      },
    },
    {
      $group: {
        _id: "$day",
        count: { $sum: 1 },
        adminCount: { $sum: "$isAdmin" },
        userCount: { $sum: "$isUser" },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $setWindowFields: {
        sortBy: { _id: 1 },
        output: {
          count: {
            $sum: "$count",
            window: { documents: ["unbounded", "current"] },
          },
          adminCount: {
            $sum: "$adminCount",
            window: { documents: ["unbounded", "current"] },
          },
          userCount: {
            $sum: "$userCount",
            window: { documents: ["unbounded", "current"] },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        count: 1,
        adminCount: 1,
        userCount: 1,
      },
    },
  ],
};

