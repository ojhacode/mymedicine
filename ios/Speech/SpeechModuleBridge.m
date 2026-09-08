#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(SpeechModule, RCTEventEmitter)

RCT_EXTERN_METHOD(startSpeech:(NSString *)language)
RCT_EXTERN_METHOD(stopSpeech)

@end