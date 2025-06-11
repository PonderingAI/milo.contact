#!/usr/bin/env node

import { Command } from 'commander';
import { createCommand } from './commands/create';
import { buildCommand } from './commands/build';
import { devCommand } from './commands/dev';

const program = new Command();

program
  .name('milo')
  .description('Milo Website Builder CLI')
  .version('0.1.0');

program
  .command('create <project-name>')
  .description('Create a new Milo project')
  .option('-t, --template <template>', 'Project template', 'basic')
  .action(createCommand);

program
  .command('build')
  .description('Build the current project')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .action(buildCommand);

program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .action(devCommand);

program.parse();