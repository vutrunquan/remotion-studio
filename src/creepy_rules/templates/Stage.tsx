import React from 'react';
import {Item, Link} from '../pictos';
import {useScene} from '../util';

/** Bộ cảnh dựng sẵn. Ghi đè từng vật bằng "setArgs", thêm vật bằng "items". */
export function expandSet(v: any): any[] {
  const a = v.setArgs ?? {};
  const hide: string[] = a.hide ?? [];
  let base: any[] = [];
  if (v.set === 'room') {
    base = [
      {id: 'window', kind: 'window', x: 470, y: 142},
      {id: 'clock', kind: 'clock', x: 749, y: 121, time: a.time ?? '4:20', min: a.min, run: a.run},
      {id: 'tv', kind: 'tv', x: 1008, y: 432, on: a.tvOn !== false},
      {id: 'chair', kind: 'armchair', x: 266, y: 435, sitter: a.sitter ?? 'sit', sweat: a.sweat},
    ];
  } else if (v.set === 'diningRoom') {
    base = [
      {id: 'window', kind: 'window', x: 520, y: 128, scale: 0.8},
      {id: 'dinner', kind: 'dinner', x: 560, y: 435},
    ];
  } else if (v.set === 'bedroom') {
    base = [
      {id: 'clock', kind: 'clock', x: a.clockX ?? 720, y: 120, time: a.time ?? '3:07', min: a.min, run: a.run},
      {id: 'bed', kind: 'bed', x: 780, y: 435, wake: a.wake ?? 0},
    ];
  }
  return base.filter((i) => !hide.includes(i.id)).map((i) => ({...i, ...(a[i.id] ?? {})}));
}

export const Stage: React.FC<{v: any}> = ({v}) => {
  const {t, accent} = useScene();
  const items = [...expandSet(v), ...(v.items ?? [])];
  const links = v.links ?? [];
  const ordered = items.map((it, i) => ({it, z: it.z ?? 0, i})).sort((a, b) => a.z - b.z || a.i - b.i);
  const z = v.zoom ?? 1;
  const [fx, fy] = v.focus ?? [609, 300];
  return (
    <g transform={z === 1 ? undefined : `translate(${fx} ${fy}) scale(${z}) translate(${-fx} ${-fy})`}>
      {ordered.map(({it, i}) => (
        <Item key={i} item={it} t={t} accent={accent} />
      ))}
      {links.map((l: any, i: number) => (
        <Link key={`l${i}`} link={l} items={items} t={t} accent={accent} />
      ))}
    </g>
  );
};
