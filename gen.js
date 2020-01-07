#!/usr/bin/env node

'use strict';

const {resolve} = require('path');
const map = require(resolve(process.cwd(), './data.js'));
const columnCount = 6;
const groupedMap = {};
const prefixs = [];
const versions = [];

function group(arr) {
  let index = -1;
  const group = [];
  for (let i = 0, len = arr.length; i < len; i++) {
    if (i % columnCount === 0) {
      index++;
      group.push({});
    }

    Object.assign(group[index], arr[i]);
  }

  return group.length > 3 ? averageAll(group) : group;
}

function averageAll(arr) {
  // console.log('------- averageAll')
  // console.log(arr)
  const accumulator = [[], [], []];
  for (let i = 0, len = arr.length; i < len; i++) {
    accumulator[i % 3].push(arr[i]);
  }

  return accumulator.map(averageAcrossBuilds);
}

function averageAcrossBuilds(arr) {
  // console.log('------- average');
  // console.log(arr)
  const result = {};
  for (const key in arr[0]) {
    if (!Object.prototype.hasOwnProperty.call(arr[0], key)) {
      continue;
    }

    // console.log(key);
    // console.log(arr.map(v => v[key]));
    result[key] = averageNumWithUnit(arr.map(v => v[key]));
  }

  // console.log(result);
  return result;
}

function averageNumWithUnit(arr) {
  const unit = arr[0].replace(/[\d.]+/, '');
  let sum = 0;
  const len = arr.length;
  for (let i = 0; i < len; i++) {
    sum += parseFloat(arr[i].replace(/[^\d.]+/g, ''));
  }

  return (Math.round(sum * 1000 / len) / 1000) + unit;
}

function printMarkdownTable(groupedMap) {
  const result = [];
  for (let i = 0, len = versions.length; i < len; i++) {
    result.push(`\n\n**Node.js ${versions[i]}**\n`);
    result.push('| | Total time (Cold) | Save DB (Cold) | Memory (Cold) | Total time (Hot) | Save DB (Hot) | Memory (Hot) |');
    result.push('|:---:|:---:|:---:|:---:|:---:|:---:|:---:|');

    prefixs.forEach(prefix => {
      const branch = groupedMap[prefix + '-node-' + versions[i]];
      if (branch) {
        result.push(`| ${prefix} | ${branch[0]['Total time']} | ${branch[0]['Save Database']} | ${branch[0]['Memory Usage(RSS)']} | ${branch[1]['Total time']} | ${branch[1]['Save Database']} | ${branch[1]['Memory Usage(RSS)']} |`);
      }
    });
  }

  return result.join('\n');
}

for (const key in map) {
  if (!Object.prototype.hasOwnProperty.call(map, key)) {
    continue;
  }

  // console.log(key);
  groupedMap[key] = group(map[key]);
  const prefix = key.replace(/-node.*/, '');
  if (!prefixs.includes(prefix)) {
      prefixs.push(prefix);
  }

  const version = parseInt(key.replace(/.*node-/, ''), 10);
  if (!versions.includes(version)) {
      versions.push(version);
  }
}

prefixs.sort((a, b) => {
  const buildNumA = parseInt(a.match(/(\d+)$/)[1], 10);
  const buildNumB = parseInt(b.match(/(\d+)$/)[1], 10);
  return buildNumA - buildNumB;
});
versions.sort((a, b) => (a - b));

// console.log(groupedMap);
// console.log(prefixs);
// console.log(versions);
console.log('A benchmark using a hexo dummy website (with 900 posts): ');
console.log('\nMeasure 5 times and calculate the average for each benchmark.');
console.log(printMarkdownTable(groupedMap));
