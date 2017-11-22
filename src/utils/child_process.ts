// Copyright 2017 The RLS Developers. See the COPYRIGHT
// file at the top-level directory of this distribution and at
// http://rust-lang.org/COPYRIGHT.
//
// Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
// http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
// <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
// option. This file may not be copied, modified, or distributed
// except according to those terms.

'use strict';

/**
 * This module keeps track of child processes so that they can be killed when the extension
 * deactivates, which is espcally important for non-Windows platforms where child processes
 * continue running after the parent exits.
 */

import * as child_process from 'child_process';

export type ChildProcess = child_process.ChildProcess;

export interface ExecChildProcessResult<TOut = string> {
    readonly stdout: TOut;
    readonly stderr: TOut;
}

export function execChildProcess(command: string): Promise<ExecChildProcessResult> {
    const r: Promise<ExecChildProcessResult> = new Promise((resolve, reject) => {
        wrap(child_process.exec(command, (error, stdout, stderr) => {
            if (!!error) {
                reject(error);
                return;
            }

            resolve({
                stdout,
                stderr,
            });
        }));
    });
    return r;
}

export function spawnChildProcess(command: string, args: Array<any>, options: Object): Promise<ChildProcess> {
    return Promise.resolve(wrap(child_process.spawn(command, args, options)));
}

let children: Array<child_process.ChildProcess> = [];

function wrap(child: child_process.ChildProcess) : child_process.ChildProcess {
    children.push(child);
    // Attach a listener to remove the child process when it exits.
    child.on('exit', () => {
        let index = children.indexOf(child);
        if (index > -1) {
            children.splice(index, 1);
        }
    });
    return child;
}

export function killAllChildProcesses() {
    console.info('Killing ' + children.length + ' child processes');
    while (children.length > 0) {
        let child = children.splice(0, 1)[0];
        child.kill();
    }
}
