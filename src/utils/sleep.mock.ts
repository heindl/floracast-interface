function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export default sleep;

// align
// indent
// no-consecutive-blank-lines
// one-line
// quotemark
// semicolon
// typedef-whitespace
// whitespace
