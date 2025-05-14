import moment from 'moment';

/**
 * Get all dates between two dates
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns An array of dates between the start and end date
 *
 * NOTES:
 * - If both dates are the same, it will return an array with the date only once
 * - The order of the dates is from the start date to the end date
 * - If the start date is after the end date, it will return an empty array
 *
 * @example
 * getDatesBetween(new Date('2021-01-01'), new Date('2021-01-05'))
 *
 * returns [new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03'), new Date('2021-01-04'), new Date('2021-01-05')]
 */
export const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
  const dates = [];

  const currentDate = moment(startDate);
  const endDateMoment = moment(endDate);

  if (currentDate.isAfter(endDateMoment)) {
    return [];
  }

  if (currentDate.isSame(endDateMoment)) {
    return [currentDate.toDate()];
  }

  while (currentDate.isBefore(endDateMoment)) {
    dates.push(currentDate.toDate());
    currentDate.add(1, 'day');
  }

  return dates;
};
