include rules.mk
all:dinner-crm srv

install:srv-install  crm-install 
image:srv-image crm-image
push:srv-push crm-push
test:srv-test

echo-env:
	@echo "TARGET_DIR=$(TARGET_DIR)"
	@echo "TAG_VERSION=$(TAG_VERSION)"
	@echo "REGISTRY=$(REGISTRY)"

srv:
	$(MAKE) -C dinner-srv
srv-install:
	$(MAKE) -C dinner-srv install
srv-image:
	$(MAKE) -C dinner-srv image
srv-push:
	$(MAKE) -C dinner-srv push
srv-test:
	$(MAKE) -C dinner-srv test


dinner-crm:
	$(MAKE) -C crm
crm-install:
	$(MAKE) -C crm install
crm-image:
	$(MAKE) -C crm image
crm-push:
	$(MAKE) -C crm push

.PHONY: clean cleanall
clean:srv-clean  
cleanall:srv-cleanall crm-cleanall
	rm -rf $(TARGET_DIR)

srv-clean:
	$(MAKE) -C dinner-srv clean
srv-cleanall:
	$(MAKE) -C dinner-srv cleanall
crm-clean:
	$(MAKE) -C crm clean
crm-cleanall:
	$(MAKE) -C crm cleanall