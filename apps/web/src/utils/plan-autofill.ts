export function computeNextMonthlyFeeInput(params: {
  previousInput: string;
  previousAutoValue: number | null;
  nextAutoValue: number;
}) {
  const previousTrimmed = params.previousInput.trim();
  const previousNumber = previousTrimmed.length ? Number(previousTrimmed) : NaN;

  if (!previousTrimmed.length || !Number.isFinite(previousNumber)) {
    return { nextInput: String(params.nextAutoValue), nextAutoValue: params.nextAutoValue };
  }

  if (params.previousAutoValue !== null && previousNumber === params.previousAutoValue) {
    return { nextInput: String(params.nextAutoValue), nextAutoValue: params.nextAutoValue };
  }

  return { nextInput: params.previousInput, nextAutoValue: params.previousAutoValue };
}
