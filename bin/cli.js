#!/usr/bin/env node

import { Command } from 'commander';
import degit from 'degit';
import inquirer from 'inquirer';
import shell from 'shelljs';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { parse } from '../utils/index.js'

const program = new Command();

const choices = ["esp8266", "esp32", "esp32c3"]

program
    .version('1.0.0')
    .argument('[project-name]', 'name of your project')
    .action(async (projectName) => {
        let projectDir = projectName;
        if (!projectDir) {
            const answer = await inquirer.prompt([{ type: 'input', name: 'projectName', message: 'How is your project called?', default: 'vuesp.my-project', },]);
            projectDir = answer.projectName;
        }

        if (fs.existsSync(projectDir)) {
            console.log(chalk.red(`Error: Folder "${projectDir}" already exists!`));
            process.exit(1);
        }

        console.log(chalk.blue(`Creating project in ./${projectDir}...`));

        try {
            const emitter = degit('bondrogeen/vuesp', { cache: false, force: true, verbose: true, });

            await emitter.clone(projectDir);
            console.log(chalk.green('Template downloaded successfully!'));

            shell.cd(projectDir);

            const answer = await inquirer.prompt([{ type: 'list', choices, name: 'platform', message: 'Select board', default: 'esp8266', },]);
            let platform = answer.platform;

            console.log(chalk.blue(`Using platform: ${platform}`));

            const platformioPath = path.join(process.cwd(), 'platformio.ini');
            const platformioFile = fs.readFileSync(platformioPath, 'utf8');
            const config = parse(platformioFile, platform)

            fs.writeFileSync(platformioPath, config);

            shell.cd('vue');

            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

            packageJson.name = projectDir;

            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

            const { installDeps } = await inquirer.prompt([{ type: 'confirm', name: 'installDeps', message: 'Install dependencies?', default: true, },]);

            if (installDeps) {
                console.log(chalk.blue('Installing dependencies...'));
                if (shell.exec('npm install').code !== 0) {
                    shell.echo(chalk.red('Error: npm install failed'));
                    shell.exit(1);
                }
                console.log(chalk.green('Dependencies installed successfully!'));
            }

            console.log(chalk.green.bold('\nAll done! 🎉'));
            console.log(chalk.blue(`\nNext steps:\n  cd ${projectDir}\n  npm run dev`));

        } catch (err) {
            console.error(chalk.red('Error:'), err);
            process.exit(1);
        }
    });

program.parse();