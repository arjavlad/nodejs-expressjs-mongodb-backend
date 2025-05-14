use('mydb');

const mongoose = require('mongoose');

// db.getCollection('admins').find({
//   $text: {
//     $search: 'admin',
//   },
// });

const userId = new mongoose.Types.ObjectId('67fa38f76f85b1ab2950b1e4');

db.userConnections.aggregate([
  {
    $match: {
      users: userId,
    },
  },
  { $skip: 0 },
  { $limit: 10 },
  {
    $project: {
      users: {
        $filter: {
          input: '$users',
          as: 'user',
          cond: { $ne: ['$$user', userId] },
        },
      },
    },
  },
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
