import { type PrimitiveAtom } from "jotai";

export function castAtomWithValue<Value, SubValue extends Value>(
  atom: PrimitiveAtom<Value>,
  _value: SubValue,
): PrimitiveAtom<SubValue> {
  return atom as PrimitiveAtom<SubValue>;
}
