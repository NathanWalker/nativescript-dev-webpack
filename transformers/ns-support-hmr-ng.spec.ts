import { tags } from "@angular-devkit/core";
import { createTypescriptContext, transformTypescript } from "@ngtools/webpack/src/transformers";
import { nsReplaceBootstrap } from './ns-replace-bootstrap';
import { nsSupportHmrNg, getHmrOptionsCode, getAcceptMainModuleCode, GeneratedDynamicAppOptions } from "./ns-support-hmr-ng";
import { AngularCompilerPlugin } from "@ngtools/webpack";

describe("@ngtools/webpack transformers", () => {
    describe("ns-support-hmr-ng", () => {
        const nsFactoryImportName = `__NgCli_bootstrap_2_1`;
        const handleHmrPlatformDynamicImport = `import * as nativescript_angular_platform_Generated from "nativescript-angular/platform";`;
        const handleHmrPlatformStaticImport = `import * as nativescript_angular_platform_Generated from "nativescript-angular/platform-static";`;
        const handleAotPlatformStaticImport = `import * as __NgCli_bootstrap_1_1 from "nativescript-angular/platform-static";`;
        const handleAotNgFactoryImport = `import * as ${nsFactoryImportName} from "./test-file.ts.ngfactory";`;
        const handleHmrOptionsDeclaration = `var ${GeneratedDynamicAppOptions} = {};`;
        const nsStaticPlatformCall = `nativescript_angular_platform_Generated.platformNativeScript`;
        const nsDynamicPlatformCall = `nativescript_angular_platform_Generated.platformNativeScriptDynamic`;
        const handleHmrOptionsCode = getHmrOptionsCode("AppModule", "./app/app.module");
        const acceptMainModuleCode = getAcceptMainModuleCode("./app/app.module");
        const handleHmrOptionsAotCode = getHmrOptionsCode("AppModuleNgFactory", "./test-file.ts.ngfactory");
        const acceptMainModuleAotCode = getAcceptMainModuleCode("./test-file.ts.ngfactory");
        const getAppOptions = (currentAppOptionsString?: string) => {
            return `Object.assign(${currentAppOptionsString || "{}"}, ${GeneratedDynamicAppOptions})`
        };
        const defaultAppOptions = getAppOptions();
        const testCases = [{
            name: "should handle HMR when platformNativeScriptDynamic is called without arguments",
            rawFile: `
                import { platformNativeScriptDynamic } from "nativescript-angular/platform";
                import { AppModule } from "./app/app.module";
                platformNativeScriptDynamic().bootstrapModule(AppModule);
            `,
            transformedFile: `
                ${handleHmrPlatformDynamicImport}
                import { AppModule } from "./app/app.module";

                ${handleHmrOptionsDeclaration}
                ${handleHmrOptionsCode}
                ${acceptMainModuleCode}

                ${nsDynamicPlatformCall}(${defaultAppOptions}).bootstrapModule(AppModule);
            `,
            transformedFileWithAot: `
                ${handleHmrPlatformStaticImport}
                ${handleAotPlatformStaticImport}
                ${handleAotNgFactoryImport}

                ${handleHmrOptionsDeclaration}
                ${handleHmrOptionsAotCode}
                ${acceptMainModuleAotCode}

                ${nsStaticPlatformCall}(${defaultAppOptions}).bootstrapModuleFactory(${nsFactoryImportName}.AppModuleNgFactory);
            `
        },
        {
            name: "should not handle HMR when the AppModule import cannot be found",
            rawFile: `
                import { platformNativeScriptDynamic } from "nativescript-angular/platform";
                platformNativeScriptDynamic().bootstrapModule(SyntaxErrorModule);
            `,
            transformedFile: `
                import { platformNativeScriptDynamic } from "nativescript-angular/platform";
                platformNativeScriptDynamic().bootstrapModule(SyntaxErrorModule);
            `,
            transformedFileWithAot: `
                import { platformNativeScriptDynamic } from "nativescript-angular/platform";
                platformNativeScriptDynamic().bootstrapModule(SyntaxErrorModule);
            `
        },
        {
            name: "(known limitation) should not handle HMR when the platformNativeScriptDynamic method is renamed",
            rawFile: `
                import { platformNativeScriptDynamic as x } from "nativescript-angular/platform";
                x().bootstrapModule(SyntaxErrorModule);
            `,
            transformedFile: `
                import { platformNativeScriptDynamic as x } from "nativescript-angular/platform";
                x().bootstrapModule(SyntaxErrorModule);
            `,
            transformedFileWithAot: `
                import { platformNativeScriptDynamic as x } from "nativescript-angular/platform";
                x().bootstrapModule(SyntaxErrorModule);
            `
        },
        {
            name: "(known limitation) should not handle HMR when the bootstrapModule method is renamed",
            rawFile: `
                import { platformNativeScriptDynamic } from "nativescript-angular/platform";

                const x = platformNativeScriptDynamic().bootstrapModule;
                x(SyntaxErrorModule);
            `,
            transformedFile: `
                import { platformNativeScriptDynamic } from "nativescript-angular/platform";

                const x = platformNativeScriptDynamic().bootstrapModule;
                x(SyntaxErrorModule);
            `,
            transformedFileWithAot: `
                import { platformNativeScriptDynamic } from "nativescript-angular/platform";

                const x = platformNativeScriptDynamic().bootstrapModule;
                x(SyntaxErrorModule);
            `
        },
        {
            name: "should handle HMR when AOT is manually configured",
            rawFile: `
                import { platformNativeScript } from "nativescript-angular/platform-static";
                import { AppModuleNgFactory } from "./app/app.module.ngfactory";
                platformNativeScript().bootstrapModuleFactory(AppModuleNgFactory);
            `,
            transformedFile: `
                ${handleHmrPlatformStaticImport}
                import { AppModuleNgFactory } from "./app/app.module.ngfactory";

                ${handleHmrOptionsDeclaration}
                ${getHmrOptionsCode("AppModuleNgFactory", "./app/app.module.ngfactory")}
                ${getAcceptMainModuleCode("./app/app.module.ngfactory")}

                ${nsStaticPlatformCall}(${defaultAppOptions}).bootstrapModuleFactory(AppModuleNgFactory);
            `,
            transformedFileWithAot: `
                ${handleHmrPlatformStaticImport}
                import { AppModuleNgFactory } from "./app/app.module.ngfactory";

                ${handleHmrOptionsDeclaration}
                ${getHmrOptionsCode("AppModuleNgFactory", "./app/app.module.ngfactory")}
                ${getAcceptMainModuleCode("./app/app.module.ngfactory")}

                ${nsStaticPlatformCall}(${defaultAppOptions}).bootstrapModuleFactory(AppModuleNgFactory);
            `
        },
        {
            name: "should handle HMR when platformNativeScriptDynamic is called without arguments and non default app module",
            customAppModuleName: "CustomModule",
            rawFile: `
                import { platformNativeScriptDynamic } from "nativescript-angular/platform";
                import { CustomModule } from "./custom/custom.module";
                platformNativeScriptDynamic().bootstrapModule(CustomModule);
            `,
            transformedFile: `
                ${handleHmrPlatformDynamicImport}
                import { CustomModule } from "./custom/custom.module";

                ${handleHmrOptionsDeclaration}
                ${getHmrOptionsCode("CustomModule", "./custom/custom.module")}
                ${getAcceptMainModuleCode("./custom/custom.module")}

                ${nsDynamicPlatformCall}(${defaultAppOptions}).bootstrapModule(CustomModule);
            `,
            transformedFileWithAot: `
                ${handleHmrPlatformStaticImport}
                ${handleAotPlatformStaticImport}
                ${handleAotNgFactoryImport}

                ${handleHmrOptionsDeclaration}
                ${getHmrOptionsCode("CustomModuleNgFactory", "./test-file.ts.ngfactory")}
                ${getAcceptMainModuleCode("./test-file.ts.ngfactory")}

                ${nsStaticPlatformCall}(${defaultAppOptions}).bootstrapModuleFactory(${nsFactoryImportName}.CustomModuleNgFactory);
            `
        },
        {
            name: "should handle HMR when platformNativeScriptDynamic is called from * import",
            rawFile: `
                import * as nsNgPlatform from "nativescript-angular/platform";
                import { AppModule } from "./app/app.module";
                nsNgPlatform.platformNativeScriptDynamic().bootstrapModule(AppModule);
            `,
            transformedFile: `
                ${handleHmrPlatformDynamicImport}
                import { AppModule } from "./app/app.module";

                ${handleHmrOptionsDeclaration}
                ${handleHmrOptionsCode}
                ${acceptMainModuleCode}

                ${nsDynamicPlatformCall}(${defaultAppOptions}).bootstrapModule(AppModule);
            `,
            transformedFileWithAot: `
                ${handleHmrPlatformStaticImport}
                ${handleAotPlatformStaticImport}
                ${handleAotNgFactoryImport}

                ${handleHmrOptionsDeclaration}
                ${handleHmrOptionsAotCode}
                ${acceptMainModuleAotCode}

                ${nsStaticPlatformCall}(${defaultAppOptions}).bootstrapModuleFactory(${nsFactoryImportName}.AppModuleNgFactory);
            `
        },
        {
            name: "should handle HMR when platformNativeScriptDynamic is called with inline appOptions",
            rawFile: `
                import { platformNativeScriptDynamic } from "nativescript-angular/platform";
                import { AppModule } from "./app/app.module";
                platformNativeScriptDynamic({ bootInExistingPage: true }).bootstrapModule(AppModule);
            `,
            transformedFile: `
                ${handleHmrPlatformDynamicImport}
                import { AppModule } from "./app/app.module";

                ${handleHmrOptionsDeclaration}
                ${handleHmrOptionsCode}
                ${acceptMainModuleCode}

                ${nsDynamicPlatformCall}(${getAppOptions("{ bootInExistingPage: true }")}).bootstrapModule(AppModule);
            `,
            transformedFileWithAot: `
                ${handleHmrPlatformStaticImport}
                ${handleAotPlatformStaticImport}
                ${handleAotNgFactoryImport}

                ${handleHmrOptionsDeclaration}
                ${handleHmrOptionsAotCode}
                ${acceptMainModuleAotCode}

                ${nsStaticPlatformCall}(${getAppOptions("{ bootInExistingPage: true }")}).bootstrapModuleFactory(${nsFactoryImportName}.AppModuleNgFactory);
            `
        },
        {
            name: "should handle HMR when platformNativeScriptDynamic is called with appOptions variable",
            rawFile: `
                import { platformNativeScriptDynamic } from "nativescript-angular/platform";
                import { AppModule } from "./app/app.module";
                const appOptions = { bootInExistingPage: true };
                platformNativeScriptDynamic(appOptions).bootstrapModule(AppModule);
            `,
            transformedFile: `
                ${handleHmrPlatformDynamicImport}
                import { AppModule } from "./app/app.module";

                var ${GeneratedDynamicAppOptions} = {};
                ${handleHmrOptionsCode}
                ${acceptMainModuleCode}

                const appOptions = { bootInExistingPage: true };
                
                ${nsDynamicPlatformCall}(${getAppOptions("appOptions")}).bootstrapModule(AppModule);
            `,
            transformedFileWithAot: `
                ${handleHmrPlatformStaticImport}
                ${handleAotPlatformStaticImport}
                ${handleAotNgFactoryImport}

                var ${GeneratedDynamicAppOptions} = {};
                ${handleHmrOptionsAotCode}
                ${acceptMainModuleAotCode}

                const appOptions = { bootInExistingPage: true };
                
                ${nsStaticPlatformCall}(${getAppOptions("appOptions")}).bootstrapModuleFactory(${nsFactoryImportName}.AppModuleNgFactory);
            `
        },

        {
            name: "should handle HMR when platformNativeScriptDynamic is called with multiple arguments",
            rawFile: `
                        import { platformNativeScriptDynamic } from "nativescript-angular/platform";
                        import { AppModule } from "./app/app.module";
                        platformNativeScriptDynamic({ bootInExistingPage: true }, ["provider1", "provider2"]).bootstrapModule(AppModule);
                    `,
            transformedFile: `
                        ${handleHmrPlatformDynamicImport}
                        import { AppModule } from "./app/app.module";

                        ${handleHmrOptionsDeclaration}
                        ${handleHmrOptionsCode}
                        ${acceptMainModuleCode}

                        ${nsDynamicPlatformCall}(${getAppOptions("{ bootInExistingPage: true }")}, ["provider1", "provider2"]).bootstrapModule(AppModule);
                    `,
            transformedFileWithAot: `
                        ${handleHmrPlatformStaticImport}
                        ${handleAotPlatformStaticImport}
                        ${handleAotNgFactoryImport}

                        ${handleHmrOptionsDeclaration}
                        ${handleHmrOptionsAotCode}
                        ${acceptMainModuleAotCode}

                        ${nsStaticPlatformCall}(${getAppOptions("{ bootInExistingPage: true }")}, ["provider1", "provider2"]).bootstrapModuleFactory(${nsFactoryImportName}.AppModuleNgFactory);
                    `
        },
        {
            name: "should accept HMR before the user when custom handling is in place",
            rawFile: `
                        import { platformNativeScriptDynamic } from "nativescript-angular/platform";
                        import { AppModule } from "./app/app.module";

                        if (module["hot"]) {
                            module["hot"].accept(["./app/app.module"], function () {
                                // customHandling
                            });
                        }

                        platformNativeScriptDynamic().bootstrapModule(AppModule);
                    `,
            transformedFile: `
                        ${handleHmrPlatformDynamicImport}
                        import { AppModule } from "./app/app.module";

                        ${handleHmrOptionsDeclaration}
                        ${handleHmrOptionsCode}
                        ${acceptMainModuleCode}

                        if (module["hot"]) {
                            module["hot"].accept(["./app/app.module"], function () {
                                // customHandling
                            });
                        }

                        ${nsDynamicPlatformCall}(${defaultAppOptions}).bootstrapModule(AppModule);
                    `,
            transformedFileWithAot: `
                        ${handleHmrPlatformStaticImport}
                        ${handleAotPlatformStaticImport}
                        ${handleAotNgFactoryImport}

                        ${handleHmrOptionsDeclaration}
                        ${handleHmrOptionsAotCode}
                        ${acceptMainModuleAotCode}

                        if (module["hot"]) {
                            module["hot"].accept(["./app/app.module"], function () {
                                // customHandling
                            });
                        }

                        ${nsStaticPlatformCall}(${defaultAppOptions}).bootstrapModuleFactory(${nsFactoryImportName}.AppModuleNgFactory);
                    `
        }
        ];
        testCases.forEach((testCase: any) => {
            it(`${testCase.name}`, async () => {
                const testFile = "/project/src/test-file.ts";
                const input = tags.stripIndent`${testCase.rawFile}`;
                const output = tags.stripIndent`${testCase.transformedFile}`;
                const { program, compilerHost } = createTypescriptContext(input);
                const ngCompiler = <AngularCompilerPlugin>{
                    typeChecker: program.getTypeChecker(),
                    entryModule: {
                        path: testFile,
                        className: "AppModule",
                    },
                };
                const transformer = nsSupportHmrNg(() => ngCompiler, testFile);
                const result = transformTypescript(undefined, [transformer], program, compilerHost);

                expect(tags.oneLine`${result}`).toEqual(tags.oneLine`${output}`);
            });

            it(`${testCase.name} (in combination with AOT transformer)`, async () => {
                const projectDir = "/project/src/";
                const testFile = `${projectDir}test-file.ts`;
                const input = tags.stripIndent`${testCase.rawFile}`;
                const output = tags.stripIndent`${testCase.transformedFileWithAot}`;
                const { program, compilerHost } = createTypescriptContext(input);
                const ngCompiler = <AngularCompilerPlugin>{
                    typeChecker: program.getTypeChecker(),
                    entryModule: {
                        path: testFile,
                        className: testCase.customAppModuleName || "AppModule",
                    },
                };

                const aotTransformer = nsReplaceBootstrap(() => ngCompiler, testFile, projectDir);
                const hmrTransformer = nsSupportHmrNg(() => ngCompiler, testFile);
                const result = transformTypescript(undefined, [aotTransformer, hmrTransformer], program, compilerHost);

                expect(tags.oneLine`${result}`).toEqual(tags.oneLine`${output}`);
            });
        });
    });
});
