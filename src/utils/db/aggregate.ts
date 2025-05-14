/**
 * Type for MongoDB capitalize aggregation stage
 */
type MongoCapitalizeOperation = {
  $addFields: {
    [key: string]: {
      $concat: Array<{
        $toUpper?: { $substrCP: [string, number, number] };
        $substrCP?: [string, number, { $subtract: [{ $strLenCP: string }, number] }];
      }>;
    };
  };
};

/**
 * Type for MongoDB regex aggregation stage
 */
type MongoRegexOperation = {
  $or: Array<{
    [key: string]: {
      $regex: string;
      $options: string;
    };
  }>;
};

/**
 * Utility class for MongoDB aggregation pipeline operations
 */
export class AggregateUtils {
  /**
   * Creates an aggregation stage to capitalize the value of the input key
   * @param inputKey - The input key to capitalize
   * @param outputKey - The output key to store the capitalized value
   * @returns Aggregation stage to capitalize the value
   *
   * @example
   * const stage = aggregateUtils.capitalizeStage('name', 'capitalizedName');
   * const result = await Model.aggregate([stage]);
   */
  public static capitalizeStage(inputKey: string, outputKey: string): MongoCapitalizeOperation {
    const fieldUpdate: Record<string, MongoCapitalizeOperation['$addFields'][string]> = {};
    const value = '$' + inputKey;
    if (!outputKey || outputKey.length === 0) {
      outputKey = inputKey;
    }

    fieldUpdate[outputKey] = {
      $concat: [
        { $toUpper: { $substrCP: [value, 0, 1] } },
        { $substrCP: [value, 1, { $subtract: [{ $strLenCP: value }, 1] }] },
      ],
    };
    return { $addFields: fieldUpdate };
  }

  /**
   * Creates an aggregation stage for regex matching
   * @param inputKey - The input key to match against
   * @param search - The search string to use in the regex
   * @returns Aggregation stage for regex matching
   *
   * @example
   * const stage = aggregateUtils.regexMatchStage('name', 'John');
   * const result = await Model.aggregate([stage]);
   */
  public static regexMatchStage(inputKey: string, search: string): MongoRegexOperation {
    const query: MongoRegexOperation['$or'] = [];
    query.push({ [inputKey]: { $regex: search, $options: 'i' } });
    query.push({ [inputKey]: { $regex: `^${search}$`, $options: 'i' } });
    return { $or: query };
  }
}

export const aggregateUtils = new AggregateUtils();
