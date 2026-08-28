import type { RuleLevel, RulePack } from "@coding-bible/rules";
import { useEffect, useState } from "react";

import {
  readRuleBrowserState,
  writeRuleBrowserState,
} from "../utils/urlState";

export const useRuleBrowserState = () => {
  const [state, setState] = useState(readRuleBrowserState);

  useEffect(() => {
    writeRuleBrowserState(state);
  }, [state]);

  const setLevel = (level: RuleLevel | "all") => {
    setState((currentState) =>
      currentState.level === level ? currentState : { ...currentState, level },
    );
  };

  const setPack = (pack: RulePack | "all") => {
    setState((currentState) =>
      currentState.pack === pack ? currentState : { ...currentState, pack },
    );
  };

  const setQuery = (query: string) => {
    setState((currentState) =>
      currentState.query === query ? currentState : { ...currentState, query },
    );
  };

  return {
    level: state.level,
    pack: state.pack,
    query: state.query,
    setLevel,
    setPack,
    setQuery,
  };
};
