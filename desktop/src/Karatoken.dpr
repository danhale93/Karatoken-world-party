{*
    Karatoken - Integrated Karaoke Platform

	Karatoken is the legal property of its developers,
	whose names	are too numerous to list here. Please refer to the
	COPYRIGHT file distributed with this source distribution.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. Check "LICENSE" file. If not, see
	<http://www.gnu.org/licenses/>.
 *}


program Karatoken;

{$IFDEF MSWINDOWS}
  {$R '..\res\link.res' '..\res\link.rc'}
{$ENDIF}

{$MODE OBJFPC}

{$I switches.inc}

uses
  {$IFDEF Unix}
  cthreads,            // THIS MUST be the first used unit in FPC if Threads are used!!
                       // (see http://wiki.lazarus.freepascal.org/Multithreaded_Application_Tutorial)
  cwstring,            // Enable Unicode support
  {$ENDIF}

  {$IFNDEF FPC}
  ctypes                 in 'lib\ctypes\ctypes.pas', // FPC compatibility types for C libs
  {$ENDIF}

  //------------------------------
  //Includes - 3rd Party Libraries
  //------------------------------
  SQLiteTable3  		 in 'lib\SQLite\SQLiteTable3.pas',
  SQLite3       		 in 'lib\SQLite\SQLite3.pas',
  sdl2                   in 'lib\SDL2\sdl2.pas',
  SDL2_image             in 'lib\SDL2\SDL2_image.pas',
  //new work on current OpenGL implementation
  dglOpenGL              in 'lib\dglOpenGL\dglOpenGL.pas',
  UMediaCore_SDL         in 'media\UMediaCore_SDL.pas',

  zlib                   in 'lib\zlib\zlib.pas',
  freetype               in 'lib\freetype\freetype.pas',

  avcodec in 'lib\'+FFMPEG_DIR+'\avcodec.pas',
  avformat in 'lib\'+FFMPEG_DIR+'\avformat.pas',
  avutil in 'lib\'+FFMPEG_DIR+'\avutil.pas',
  rational in 'lib\'+FFMPEG_DIR+'\rational.pas',
  avio in 'lib\'+FFMPEG_DIR+'\avio.pas',
  swresample in 'lib\'+FFMPEG_DIR+'\swresample.pas',
  swscale in 'lib\'+FFMPEG_DIR+'\swscale.pas',
  UMediaCore_FFmpeg in 'media\UMediaCore_FFmpeg.pas',

  {$IFDEF UseProjectM}
  projectM      in 'lib\projectM\projectM.pas',
  {$ENDIF}

  {$IFDEF UseMIDIPort}
  MidiCons      in 'lib\midi\MidiCons.pas',

  CircBuf       in 'lib\midi\CircBuf.pas',
  DelphiMcb     in 'lib\midi\DelphiMcb.pas',
  MidiDefs      in 'lib\midi\MidiDefs.pas',
  MidiFile      in 'lib\midi\MidiFile.pas',
  MidiOut       in 'lib\midi\MidiOut.pas',
  MidiType      in 'lib\midi\MidiType.pas',
  {$ENDIF}

  {$IFDEF FPC}
  FileUtil in 'lib\Lazarus\components\lazutils\fileutil.pas',
  FPCAdds in 'lib\Lazarus\components\lazutils\fpcadds.pas',
  LazUtilsStrConsts in 'lib\Lazarus\components\lazutils\lazutilsstrconsts.pas',
  LazFileUtils in 'lib\Lazarus\components\lazutils\lazfileutils.pas',
  LazUTF8 in 'lib\Lazarus\components\lazutils\lazutf8.pas',
  LazUTF8Classes in 'lib\Lazarus\components\lazutils\lazutf8classes.pas',
  Masks in 'lib\Lazarus\components\lazutils\masks.pas',
  {$ENDIF}
  CpuCount in 'lib\other\cpucount.pas',
  {$IFDEF MSWINDOWS}
  // FPC compatibility file for Allocate/DeallocateHWnd
  WinAllocation in 'lib\other\WinAllocation.pas',
  Windows,
  {$ENDIF}

  //------------------------------
  //Includes - Lua Support
  //------------------------------
  ULuaCore               in 'lua\ULuaCore.pas',
  ULuaGl                 in 'lua\ULuaGl.pas',
  ULuaLog                in 'lua\ULuaLog.pas',
  ULuaParty              in 'lua\ULuaParty.pas',
  ULuaScreenSing         in 'lua\ULuaScreenSing.pas',
  ULuaTextGL             in 'lua\ULuaTextGL.pas',
  ULuaTexture            in 'lua\ULuaTexture.pas',
  ULuaUsdx               in 'lua\ULuaUsdx.pas',
  ULuaUtils              in 'lua\ULuaUtils.pas',
  ULua                   in 'lib\Lua\ULua.pas',

  //------------------------------
  //Includes - Base Classes
  //------------------------------
  UCommon                in 'base\UCommon.pas',
  UConfig                in 'base\UConfig.pas',
  UDataBase              in 'base\UDataBase.pas',
  UDLLManager            in 'base\UDLLManager.pas',
  UFiles                 in 'base\UFiles.pas',
  UFilesystem            in 'base\UFilesystem.pas',
  UIni                   in 'base\UIni.pas',
  ULanguage              in 'base\ULanguage.pas',
  ULog                   in 'base\ULog.pas',
  UMain                  in 'base\UMain.pas',
  UMusic                 in 'base\UMusic.pas',
  UPath                  in 'base\UPath.pas',
  UPathUtils             in 'base\UPathUtils.pas',
  UPlatform              in 'base\UPlatform.pas',
  UPlatformLinux         in 'base\UPlatformLinux.pas',
  UPlatformMacOSX        in 'base\UPlatformMacOSX.pas',
  UPlatformWindows       in 'base\UPlatformWindows.pas',
  UPlaylist              in 'base\UPlaylist.pas',
  URecord                in 'base\URecord.pas',
  URingBuffer            in 'base\URingBuffer.pas',
  USong                  in 'base\USong.pas',
  USongs                 in 'base\USongs.pas',
  UTextEncoding          in 'base\UTextEncoding.pas',
  UTime                  in 'base\UTime.pas',
  UUnicodeUtils          in 'base\UUnicodeUtils.pas',

  //------------------------------
  //Includes - Graphic Classes
  //------------------------------
  UAvatars               in 'base\UAvatars.pas',
  UDraw                  in 'base\UDraw.pas',
  UFont                  in 'base\UFont.pas',
  UGraphic               in 'base\UGraphic.pas',
  UGraphicClasses        in 'base\UGraphicClasses.pas',
  UImage                 in 'base\UImage.pas',
  USkins                 in 'base\USkins.pas',
  UTexture               in 'base\UTexture.pas',
  UThemes                in 'base\UThemes.pas',

  //------------------------------
  //Includes - Menu Classes
  //------------------------------
  UDisplay               in 'menu\UDisplay.pas',
  UDrawTexture           in 'menu\UDrawTexture.pas',
  UMenu                  in 'menu\UMenu.pas',
  UMenuBackground        in 'menu\UMenuBackground.pas',
  UMenuBackgroundColor   in 'menu\UMenuBackgroundColor.pas',
  UMenuBackgroundFade    in 'menu\UMenuBackgroundFade.pas',
  UMenuBackgroundNone    in 'menu\UMenuBackgroundNone.pas',
  UMenuBackgroundTexture in 'menu\UMenuBackgroundTexture.pas',
  UMenuBackgroundVideo   in 'menu\UMenuBackgroundVideo.pas',
  UMenuButton            in 'menu\UMenuButton.pas',
  UMenuButtonCollection  in 'menu\UMenuButtonCollection.pas',
  UMenuEqualizer         in 'menu\UMenuEqualizer.pas',
  UMenuInteract          in 'menu\UMenuInteract.pas',
  UMenuSelectSlide       in 'menu\UMenuSelectSlide.pas',
  UMenuStatic            in 'menu\UMenuStatic.pas',
  UMenuText              in 'menu\UMenuText.pas',

  //------------------------------
  //Includes - Media Classes
  //------------------------------
  UAudioConverter        in 'media\UAudioConverter.pas',
  UAudioCore_Bass        in 'media\UAudioCore_Bass.pas',
  UAudioDecoder_Bass     in 'media\UAudioDecoder_Bass.pas',
  UAudioDecoder_FFmpeg   in 'media\UAudioDecoder_FFmpeg.pas',
  UAudioInput_Bass       in 'media\UAudioInput_Bass.pas',
  UAudioInput_SDL        in 'media\UAudioInput_SDL.pas',
  UAudioPlaybackBase     in 'media\UAudioPlaybackBase.pas',
  UAudioPlayback_Bass    in 'media\UAudioPlayback_Bass.pas',
  UAudioPlayback_SDL     in 'media\UAudioPlayback_SDL.pas',
  UAudioPlayback_SoftMixer in 'media\UAudioPlayback_SoftMixer.pas',
  UVideo                 in 'media\UVideo.pas',
  UVisualizer            in 'media\UVisualizer.pas',

  //------------------------------
  //Includes - Karaoke Classes
  //------------------------------
  UBeatTimer             in 'base\UBeatTimer.pas',
  UCatCovers             in 'base\UCatCovers.pas',
  UCommandLine           in 'base\UCommandLine.pas',
  UJoystick              in 'base\UJoystick.pas',
  ULyrics                in 'base\ULyrics.pas',
  UNote                  in 'base\UNote.pas',
  UParty                 in 'base\UParty.pas',
  UPartyTournament       in 'base\UPartyTournament.pas',
  USingScores            in 'base\USingScores.pas',
  UWebcam                in 'base\UWebcam.pas',

  //------------------------------
  //Includes - Screen Classes
  //------------------------------
  UScreenAbout           in 'screens\UScreenAbout.pas',
  UScreenDevelopers      in 'screens\UScreenDevelopers.pas',
  UScreenJukebox         in 'screens\UScreenJukebox.pas',
  UScreenJukeboxOptions  in 'screens\UScreenJukeboxOptions.pas',
  UScreenJukeboxPlaylist in 'screens\UScreenJukeboxPlaylist.pas',
  UScreenLoading         in 'screens\UScreenLoading.pas',
  UScreenMain            in 'screens\UScreenMain.pas',
  UScreenOpen            in 'screens\UScreenOpen.pas',
  UScreenOptions         in 'screens\UScreenOptions.pas',
  UScreenOptionsAdvanced in 'screens\UScreenOptionsAdvanced.pas',
  UScreenOptionsGame     in 'screens\UScreenOptionsGame.pas',
  UScreenOptionsGraphics in 'screens\UScreenOptionsGraphics.pas',
  UScreenOptionsLyrics   in 'screens\UScreenOptionsLyrics.pas',
  UScreenOptionsMicrophones in 'screens\UScreenOptionsMicrophones.pas',
  UScreenOptionsNetwork  in 'screens\UScreenOptionsNetwork.pas',
  UScreenOptionsProfiles in 'screens\UScreenOptionsProfiles.pas',
  UScreenOptionsSound    in 'screens\UScreenOptionsSound.pas',
  UScreenOptionsThemes   in 'screens\UScreenOptionsThemes.pas',
  UScreenOptionsWebcam   in 'screens\UScreenOptionsWebcam.pas',
  UScreenPartyNewRound   in 'screens\UScreenPartyNewRound.pas',
  UScreenPartyOptions    in 'screens\UScreenPartyOptions.pas',
  UScreenPartyPlayer     in 'screens\UScreenPartyPlayer.pas',
  UScreenPartyRounds     in 'screens\UScreenPartyRounds.pas',
  UScreenPartyScore      in 'screens\UScreenPartyScore.pas',
  UScreenPartyTournamentOptions in 'screens\UScreenPartyTournamentOptions.pas',
  UScreenPartyTournamentPlayer in 'screens\UScreenPartyTournamentPlayer.pas',
  UScreenPartyTournamentRounds in 'screens\UScreenPartyTournamentRounds.pas',
  UScreenPartyTournamentWin in 'screens\UScreenPartyTournamentWin.pas',
  UScreenPartyWin        in 'screens\UScreenPartyWin.pas',
  UScreenPlayerSelector  in 'screens\UScreenPlayerSelector.pas',
  UScreenPopup           in 'screens\UScreenPopup.pas',
  UScreenScore           in 'screens\UScreenScore.pas',
  UScreenSong            in 'screens\UScreenSong.pas',
  UScreenSongMenu        in 'screens\UScreenSongMenu.pas',
  UScreenStatDetail      in 'screens\UScreenStatDetail.pas',
  UScreenStatMain        in 'screens\UScreenStatMain.pas',
  UScreenTop5            in 'screens\UScreenTop5.pas',

  //------------------------------
  //Includes - Sing Screen Classes
  //------------------------------
  UScreenSingController  in 'screens\controllers\UScreenSingController.pas',
  UScreenSingView        in 'screens\views\UScreenSingView.pas',

  //------------------------------
  //Includes - Web SDK
  //------------------------------
  UWebSDK                in 'webSDK\UWebSDK.pas',

  //------------------------------
  //Includes - Text GL
  //------------------------------
  TextGL                 in 'base\TextGL.pas';

begin
  // Initialize Karatoken application
  Main;
end. 