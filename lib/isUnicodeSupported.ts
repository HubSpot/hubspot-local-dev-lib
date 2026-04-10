// Adapted from https://github.com/sindresorhus/is-unicode-supported (MIT)
export function isUnicodeSupported(): boolean {
  if (process.platform !== 'win32') {
    return process.env.TERM !== 'linux';
  }

  return (
    Boolean(process.env.WT_SESSION) ||
    Boolean(process.env.TERMINUS_SUBLIME) ||
    process.env.ConEmuTask === '{cmd::Cmder}' ||
    process.env.TERM_PROGRAM === 'Terminus-Sublime' ||
    process.env.TERM_PROGRAM === 'vscode' ||
    process.env.TERM === 'xterm-256color' ||
    process.env.TERM === 'alacritty' ||
    process.env.TERMINAL_EMULATOR === 'JetBrains-JediTerm'
  );
}
