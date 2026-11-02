import React from 'react';
import {Stage} from './Stage';
import {Counter} from './Counter';
import {Exhibit} from './Exhibit';
import {RuleCard} from './RuleCard';
import {Stamp, TextCard, TitleCard} from './Cards';

export const TEMPLATE_NAMES = ['stage', 'counter', 'exhibit', 'rule', 'title', 'text', 'stamp', 'black'];

export const Visual: React.FC<{v: any; rule: {active: number; total: number} | null}> = ({v, rule}) => {
  if (!v) return null;
  switch (v.tpl) {
    case 'stage': return <Stage v={v} />;
    case 'counter': return <Counter v={v} />;
    case 'exhibit': return <Exhibit v={v} />;
    case 'rule': return <RuleCard v={v} total={v.total ?? rule?.total ?? 0} active={v.n ?? rule?.active ?? 1} />;
    case 'title': return <TitleCard v={v} />;
    case 'text': return <TextCard v={v} />;
    case 'stamp': return <Stamp v={v} />;
    default: return null;
  }
};
