package io.github.tiaggofg.lumo.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.application.stereotype.Query;
import io.github.tiaggofg.lumo.domain.stereotype.AggregateRoot;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

class CleanArchitectureArchTest {

    private static final String BASE_PACKAGE = "io.github.tiaggofg.lumo";
    private static JavaClasses importedClasses;

    @BeforeAll
    static void setUp() {
        importedClasses = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages(BASE_PACKAGE);
    }

    @Test
    void domainShouldNotDependOnFrameworksOrOuterLayers() {
        noClasses()
                .that().resideInAPackage("..domain..")
                .should().dependOnClassesThat()
                .resideInAnyPackage(
                        "io.quarkus..",
                        "jakarta..",
                        "org.hibernate..",
                        "com.fasterxml..",
                        "..application..",
                        "..infrastructure.."
                )
                .allowEmptyShould(true)
                .check(importedClasses);
    }

    @Test
    void applicationShouldNotDependOnInfrastructureJpaOrJaxRs() {
        noClasses()
                .that().resideInAPackage("..application..")
                .should().dependOnClassesThat()
                .resideInAnyPackage(
                        "..infrastructure..",
                        "jakarta.persistence..",
                        "jakarta.ws.rs.."
                )
                .allowEmptyShould(true)
                .check(importedClasses);
    }

    @Test
    void commandAndQueryStereotypesShouldOnlyBeUsedInApplicationLayer() {
        classes()
                .that().areAnnotatedWith(Command.class)
                .or().areAnnotatedWith(Query.class)
                .should().resideInAPackage("..application..")
                .allowEmptyShould(true)
                .check(importedClasses);
    }

    @Test
    void domainAggregateRootsShouldNeverBeAnnotatedWithJpaAnnotations() {
        noClasses()
                .that().resideInAPackage("..domain..")
                .and().implement(AggregateRoot.class)
                .should().beAnnotatedWith(Entity.class)
                .orShould().beAnnotatedWith(Table.class)
                .allowEmptyShould(true)
                .check(importedClasses);
    }
}
