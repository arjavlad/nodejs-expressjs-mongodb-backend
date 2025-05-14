use('mydb');

const mongoose = require('mongoose');

// Using $facet
db.userConnections.aggregate([
  {
    $facet: {
      data: [{ $skip: 0 }, { $limit: 10 }],
      count: [{ $count: 'totalRecords' }],
    },
  },
]);

/*
// ***Simple Pagination with Aggregation***
// Main Query
db.userConnections.aggregate([
  { $skip: 0 },
  { $limit: 10 },
  { $unwind: '$users' },
  {
    $lookup: {
      from: 'users',
      localField: 'users',
      foreignField: '_id',
      as: 'users',
      pipeline: [
        {
          $match: {
            isActive: true,
            isDeleted: false,
            isBlocked: false,
            appAccessEnabled: true,
          },
        },
        {
          $project: {
            _id: 1,
            username: 1,
            profileImage: 1,
            greeting: 1,
            relationship: 1,
            gender: 1,
          },
        },
      ],
    },
  },
  { $unwind: '$users' },
  { $replaceRoot: { newRoot: '$users' } },
  { $sort: { 'users.username': 1 } },
]);
export type first = {second}
// Count Query
db.userConnections.aggregate([{ $count: 'totalRecords' }]);
*/
