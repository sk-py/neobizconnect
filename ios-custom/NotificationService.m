#import "NotificationService.h"

@interface NotificationService ()
@property (nonatomic, strong) void (^contentHandler)(UNNotificationContent *contentToDeliver);
@property (nonatomic, strong) UNMutableNotificationContent *bestAttemptContent;
@end

@implementation NotificationService

- (void)didReceiveNotificationRequest:(UNNotificationRequest *)request withContentHandler:(void (^)(UNNotificationContent * _Nonnull))contentHandler {
    self.contentHandler = contentHandler;
    self.bestAttemptContent = [request.content mutableCopy];
    
    NSDictionary *userInfo = request.content.userInfo;
    NSString *mediaUrl = userInfo[@"fcm_options"][@"image"];
    
    if (mediaUrl) {
        NSURL *url = [NSURL URLWithString:mediaUrl];
        NSURLSession *session = [NSURLSession sharedSession];
        [[session downloadTaskWithURL:url completionHandler:^(NSURL *location, NSURLResponse *response, NSError *error) {
            if (!error && location) {
                NSString *tmpDirectory = NSTemporaryDirectory();
                NSString *tmpFilePath = [tmpDirectory stringByAppendingPathComponent:url.lastPathComponent];
                NSURL *tmpUrl = [NSURL fileURLWithPath:tmpFilePath];
                
                [[NSFileManager defaultManager] moveItemAtURL:location toURL:tmpUrl error:nil];
                
                UNNotificationAttachment *attachment = [UNNotificationAttachment attachmentWithIdentifier:@"" URL:tmpUrl options:nil error:nil];
                if (attachment) {
                    self.bestAttemptContent.attachments = @[attachment];
                }
            }
            self.contentHandler(self.bestAttemptContent);
        }] resume];
    } else {
        self.contentHandler(self.bestAttemptContent);
    }
}

- (void)serviceExtensionTimeWillExpire {
    self.contentHandler(self.bestAttemptContent);
}

@end