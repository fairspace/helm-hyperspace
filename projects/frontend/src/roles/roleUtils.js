export const hasError = calls => Object.values(calls).some(call => call.error);
export const isLoading = calls => Object.values(calls).some(call => call.loading);
export const getRoleName = (role, workspace) => role + '-' + workspace;
