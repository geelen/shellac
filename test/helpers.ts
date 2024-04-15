import os from 'os'

/**
 * On Windows, shellac uses bash commands like "pwd" which produce Unix-style
 * paths and won't match directly process.cwd() which produces Windows-style
 * paths. We work around this by converting native paths to Unix-style before
 * comparing them to output from bash.
 */
export function bashifyNativePath(p: string): string {
  if (os.platform() === 'win32') {
    // Take a path like "C:\Users\me\project" and turn it into "/c/Users/me/project"
    return p
      .replace(/\\/g, '/')
      .replace(/^([^:/]+):/, (_match, drive) => '/' + drive.toLowerCase())
  } else {
    return p
  }
}
