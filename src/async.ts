export const sequenceAsync = <A, B>(
  values: ReadonlyArray<A>,
  fn: (a: A, currentIndex: number) => Promise<B>
): Promise<ReadonlyArray<B>> =>
  values.reduce(async (promise, a, currentIndex) => {
    const rest = await promise;
    const b = await fn(a, currentIndex);

    return [...rest, b];
  }, Promise.resolve<ReadonlyArray<B>>([]));
