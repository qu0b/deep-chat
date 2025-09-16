export class Browser {
  public static readonly IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  public static readonly IS_CHROMIUM = (window as unknown as {chrome: boolean}).chrome;

  public static readonly IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}
