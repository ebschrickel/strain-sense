import UIKit
import WebKit
import Capacitor
import StoreKit

// The app's root view controller. Disables the WKWebView's rubber-band
// overscroll so the fixed glass background can't drift and no white edge
// shows when scrolling past the top or bottom. Referenced from Main.storyboard
// (customClass="AppViewController", customModule="App"). Kept in this file so
// it is part of the App target's build phase without editing the Xcode project.
class AppViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        webView?.scrollView.bounces = false
        webView?.scrollView.alwaysBounceVertical = false
        webView?.scrollView.alwaysBounceHorizontal = false
    }

    /// Capacitor only auto-discovers plugins that ship as packages. Anything
    /// defined in the app target has to be handed to the bridge here, or the
    /// JS side gets "plugin is not implemented on ios" at runtime — while
    /// still compiling perfectly.
    ///
    /// That failure is silent by design on our side: loadEntitlement() swallows
    /// a getStatus() error so a store outage can't lock anyone out. Without
    /// this registration, that same catch would report grandfathered:false for
    /// every existing $9.99 customer and paywall the people who already paid.
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(StrainSenseIAPPlugin())
        bridge?.registerPluginInstance(StrainSenseSecureStorePlugin())
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

// MARK: - In-app purchase
//
// Kept in this file for the same reason AppViewController is: it lands in the
// App target's build phase without editing the Xcode project.

/// The single product: one permanent unlock, priced to match the $9.99 the app
/// used to cost as a paid download.
///
/// iOS only. Google Play still sells Strain Sense as a paid app, so Android
/// never reaches this code and never sees a paywall — the JS side gates on
/// platform before asking for any of it.
private enum IAP {
    /// Must match the non-consumable product id created in App Store Connect.
    static let unlockProductID = "com.resonantlabs.strainsense.unlock"

    /// Build number (CFBundleVersion) of the last release sold as a PAID
    /// download. Anyone whose original purchase was at or below this already
    /// bought the whole app and must never meet a paywall.
    ///
    /// ⚠️ The first free build must be HIGHER than this. Ship it as build 6 or
    /// above, or every new customer is grandfathered in for free.
    static let lastPaidBuild = 5
}

/// Key-value storage that survives deleting the app.
///
/// The free-results counter cannot live in UserDefaults: iOS wipes a deleted
/// app's container, so the count resets on reinstall and "three free results"
/// quietly becomes "three free results per reinstall". Keychain items outlive
/// the app, which is the whole reason this exists.
///
/// kSecAttrAccessibleAfterFirstUnlock rather than ...ThisDeviceOnly, so the
/// count also travels through an encrypted backup to a replacement phone.
@objc(StrainSenseSecureStorePlugin)
public class StrainSenseSecureStorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StrainSenseSecureStorePlugin"
    public let jsName = "StrainSenseSecureStore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
    ]

    private static let service = "com.resonantlabs.strainsense.entitlement"

    private static func baseQuery(key: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
    }

    /// Resolves `{}` when nothing is stored, so the JS side sees `undefined`
    /// rather than having to distinguish an empty string from a missing key.
    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("key is required")
            return
        }

        var query = Self.baseQuery(key: key)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)

        guard status == errSecSuccess,
              let data = item as? Data,
              let value = String(data: data, encoding: .utf8)
        else {
            call.resolve([:])
            return
        }
        call.resolve(["value": value])
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), let value = call.getString("value") else {
            call.reject("key and value are required")
            return
        }

        let query = Self.baseQuery(key: key)
        let data = Data(value.utf8)

        var status = SecItemUpdate(
            query as CFDictionary,
            [kSecValueData as String: data] as CFDictionary
        )

        if status == errSecItemNotFound {
            var insert = query
            insert[kSecValueData as String] = data
            insert[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
            status = SecItemAdd(insert as CFDictionary, nil)
        }

        guard status == errSecSuccess else {
            call.reject("Keychain write failed (\(status))")
            return
        }
        call.resolve()
    }
}

@objc(StrainSenseIAPPlugin)
public class StrainSenseIAPPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StrainSenseIAPPlugin"
    public let jsName = "StrainSenseIAP"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
    ]

    private var updatesTask: Task<Void, Never>?

    /// StoreKit can hand over a purchase long after `purchase()` returned — Ask
    /// To Buy approvals and bank confirmations both arrive here. An unfinished
    /// transaction is retried forever, so this listener runs for the app's life.
    override public func load() {
        updatesTask = Task { [weak self] in
            for await update in Transaction.updates {
                guard case .verified(let transaction) = update else { continue }
                await transaction.finish()
                self?.notifyListeners("entitlementChanged", data: ["unlocked": true])
            }
        }
    }

    deinit {
        updatesTask?.cancel()
    }

    @objc func getStatus(_ call: CAPPluginCall) {
        Task {
            let grandfathered = await Self.isGrandfathered()
            let owned = await Self.ownsUnlock()
            // Resolved up front: `??` takes an autoclosure, which cannot be async.
            let price = await Self.unlockProduct()?.displayPrice
            call.resolve([
                "unlocked": grandfathered || owned,
                "grandfathered": grandfathered,
                "price": price ?? "",
            ])
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        Task {
            guard let product = await Self.unlockProduct() else {
                call.reject("The unlock isn't available from the App Store right now.")
                return
            }
            do {
                switch try await product.purchase() {
                case .success(let verification):
                    guard case .verified(let transaction) = verification else {
                        call.reject("That purchase couldn't be verified.")
                        return
                    }
                    await transaction.finish()
                    call.resolve(["unlocked": true, "cancelled": false, "pending": false])

                case .userCancelled:
                    call.resolve(["unlocked": false, "cancelled": true, "pending": false])

                case .pending:
                    // Ask To Buy, or a bank wanting a second factor. Resolves
                    // later through the Transaction.updates listener above.
                    call.resolve(["unlocked": false, "cancelled": false, "pending": true])

                @unknown default:
                    call.resolve([
                        "unlocked": await Self.ownsUnlock(),
                        "cancelled": false,
                        "pending": false,
                    ])
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            try? await AppStore.sync()
            // Both resolved up front: `||` short-circuits through an
            // autoclosure, which cannot be async.
            let owned = await Self.ownsUnlock()
            let grandfathered = await Self.isGrandfathered()
            call.resolve(["unlocked": owned || grandfathered])
        }
    }

    private static func unlockProduct() async -> Product? {
        guard let products = try? await Product.products(for: [IAP.unlockProductID]) else {
            return nil
        }
        return products.first
    }

    private static func ownsUnlock() async -> Bool {
        for await entitlement in Transaction.currentEntitlements {
            if case .verified(let transaction) = entitlement,
               transaction.productID == IAP.unlockProductID {
                return true
            }
        }
        return false
    }

    /// Everyone who paid for the app while it cost money keeps all of it.
    ///
    /// ⚠️ On iOS `originalAppVersion` is the **CFBundleVersion** — the build
    /// number — not the marketing version. Comparing it against "1.1.1" would
    /// never match and would quietly paywall every existing customer.
    ///
    /// ⚠️ Sandbox and TestFlight report "1.0" regardless of real history, so
    /// grandfathering cannot be proven before release. An unreadable
    /// transaction is treated as not-grandfathered on purpose: the worst case
    /// is a paying customer seeing a paywall and tapping Restore, rather than
    /// the app being given away to everyone.
    private static func isGrandfathered() async -> Bool {
        guard let result = try? await AppTransaction.shared,
              case .verified(let appTransaction) = result,
              let originalBuild = Int(appTransaction.originalAppVersion)
        else { return false }
        return originalBuild <= IAP.lastPaidBuild
    }
}
