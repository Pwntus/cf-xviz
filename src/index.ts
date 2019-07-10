#!/usr/bin/env node

import AWS from 'aws-sdk';
import program from 'commander';
import chalk from 'chalk';
import open from 'open';
import { generate } from './generate';
import { writeFileSync } from 'fs';

// Match stack name after first forward slash
const ARN_STACK_NAME_REGEX = /[^\/]*\/([^\/]+)/;
const STACK_PREFIX         = 'stack:';
const LINKS: ILink[]       = [];
const NODES                = new Set();

program
  .version('1.0.3')
  .description('Visualize cross-stack references in your AWS CloudFormation stacks.')
  .option('-p, --profile <string>', 'use a specific profile from your credential file.', 'default')
  .option('-r, --region <string>', 'the region to use.', 'us-east-1')
  .option('-b, --browser <string>', 'the browser to use.', 'firefox')
  .parse(process.argv);

// Debug
program.profile = 'prod';

// Configure AWS SDK
AWS.config.update({
  apiVersion: '2010-05-15',
  credentials: new AWS.SharedIniFileCredentials({ profile: program.profile }),
  region: program.region
});

const log = (str: string, nl: boolean = true) => {
  if (nl) {
    console.log(str);
  } else {
    process.stdout.write(str);
  }
};

(async () => {
  const CF = new AWS.CloudFormation();

  try {
    // Download all exports
    log(chalk.grey('Download all exports... '), false);
    const { Exports } = await CF.listExports().promise();
    log(chalk.keyword('green').bold('OK!'));

    const jobs = Exports.map(async ({ ExportingStackId, Name }) => {

      // Which stack?
      const source = STACK_PREFIX + ExportingStackId.match(ARN_STACK_NAME_REGEX).pop();
      // What export?
      const target = Name;

      LINKS.push({
        source,
        target,
        value: 1
      })
      NODES.add(source).add(target);

      try {
        // Download all stacks who import current export
        const { Imports } = await CF.listImports({ ExportName: target }).promise();
        Imports.forEach(t => {
          t = STACK_PREFIX + t;
          LINKS.push({
            source: target,
            target: t,
            value: 1
          })
          NODES.add(t);
        });
      } catch (e) {}

    });

    log(chalk.grey(`Found ${Exports.length} exports. Inspect imports... `), false);
    await Promise.all(jobs);
    log(chalk.keyword('green').bold('OK!'));

    log(chalk.grey(`Opening web browser... `), false);
    const html = generate({
      links: LINKS,
      nodes: [...NODES]
    });
    writeFileSync('./index.html', html);
    await open('./index.html', { wait: true, app: program.browser });
    log(chalk.keyword('green').bold('OK!'));

  } catch (e) {
    log(chalk.keyword('red').bold(`FAIL! (${e.message})`));
  }
})();
