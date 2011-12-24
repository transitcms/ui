# -*- encoding: utf-8 -*-
require File.expand_path('../lib/transit/ui/version', __FILE__)

Gem::Specification.new do |s|
  s.name        = "transit-ui"
  s.version     = Transit::UI::VERSION
  s.authors     = ["Brent Kirby"]
  s.email       = ["brent@kurbmedia.com"]
  s.homepage    = ""
  s.summary     = %q{Un-Obtrusive UI and Media javascript helpers for the Transit cms engine.}
  s.description = %q{Un-Obtrusive UI and Media javascript helpers for the Transit cms engine.}

  s.rubyforge_project = "transit-ui"

  s.files         = `git ls-files`.split("\n").reject{ |path| path =~ /^assets/ }
  s.test_files    = `git ls-files -- {test,spec,features}/*`.split("\n")
  s.executables   = `git ls-files -- bin/*`.split("\n").map{ |f| File.basename(f) }
  s.require_paths = ["lib"]

  s.add_runtime_dependency("transit", ">= 0.0.3")
  
end
